import { jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';

const SYSTEM_PROMPT = `You are a concise travel and visa assistant for Borderly (borderly.net), a platform that helps travelers with visa applications, travel planning, and global mobility.

GUIDELINES:
1. Be concise — under 3 sentences when possible.
2. Ask only ONE question at a time when you need more information.
3. Remember prior messages in the conversation.
4. Guide users toward Borderly services (visa checker, eVisa applications, travel score).

For visa questions: ask nationality, then destination, then travel purpose if needed.`;

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  );
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

function normalizeTier(tier) {
  const value = (tier || 'free').toLowerCase();
  if (value === 'enterprise' || value === 'business') return 'enterprise';
  if (value === 'premium' || value === 'monthly' || value === 'lifetime') return 'premium';
  return 'free';
}

function tierHasAccess(tier) {
  return normalizeTier(tier) !== 'free';
}

function buildGeminiContents(history) {
  const contents = [];
  for (const msg of history) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: msg.content }] });
    }
  }
  return contents;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return jsonResponse(500, { error: 'Gemini API key is not configured on the server' });
    }

    const { message, conversationHistory = [], subscriptionTier = 'free' } = parseBody(event);

    if (!tierHasAccess(subscriptionTier)) {
      return jsonResponse(403, {
        error: 'AI Assistant requires a Premium or Enterprise subscription. Upgrade at /pricing',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    if (!message || typeof message !== 'string') {
      return jsonResponse(400, { error: 'Message is required' });
    }

    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    const filtered = history.filter((m) => m.role === 'user' || m.role === 'assistant');

    const contents = buildGeminiContents(filtered);
    if (
      contents.length === 0 ||
      contents[contents.length - 1].role !== 'user' ||
      contents[contents.length - 1].parts[0].text !== message
    ) {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    const model = getGeminiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 512,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', data);
      const errMsg = data?.error?.message || 'Failed to get response from Gemini';
      return jsonResponse(geminiResponse.status >= 500 ? 502 : 400, { error: errMsg });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join('') || '';

    if (!text) {
      return jsonResponse(502, { error: 'Empty response from Gemini' });
    }

    return jsonResponse(200, { response: text.trim() });
  } catch (error) {
    console.error('ai-assistant error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to process AI request',
    });
  }
};

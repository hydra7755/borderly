export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const API_BASE = '/.netlify/functions';

export async function handleAIAssistantRequest(
  message: string,
  conversationHistory: AiMessage[] = [],
  subscriptionTier = 'free'
): Promise<{ response: string }> {
  const response = await fetch(`${API_BASE}/ai-assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory: conversationHistory.filter(
        (m) => m.role === 'user' || m.role === 'assistant'
      ),
      subscriptionTier,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.code === 'SUBSCRIPTION_REQUIRED') {
      throw new Error(
        'AI Assistant is available on Premium and Enterprise plans. Upgrade at /pricing'
      );
    }
    throw new Error(data.error || `AI request failed (${response.status})`);
  }

  if (!data.response) {
    throw new Error('Invalid response from AI service');
  }

  return { response: data.response };
}

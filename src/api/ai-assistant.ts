const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function handleAIAssistantRequest(message: string, conversationHistory: Message[] = []) {
  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key is missing');
    throw new Error('DeepSeek API key is not configured');
  }

  // Log first few characters of API key for debugging (safely)
  console.log('API Key prefix:', DEEPSEEK_API_KEY.substring(0, 8) + '...');

  try {
    console.log('Sending request to DeepSeek API...');
    
    // Prepare messages with context from conversation history
    const systemMessage: Message = {
      role: 'system',
      content: `You are a concise travel and visa assistant for the Borderly website (borderly.net), a platform that helps travelers with visa applications, travel planning, and more.

IMPORTANT GUIDELINES:
1. Be extremely concise in your responses. Keep them under 3 sentences when possible.
2. Ask only ONE question at a time when collecting information.
3. If you need more information, ask one specific question rather than listing multiple options.
4. Focus on answering the exact question without unnecessary elaboration.
5. REMEMBER previous messages in the conversation. Don't ask for information the user already provided.

WEBSITE CAPABILITIES:
- E-Visa application processing for multiple countries
- Visa eligibility checker based on nationality and destination
- Tiered subscription plans (Free, Premium, Enterprise)
- AI travel assistant for advice and recommendations
- Travel score assessment based on questionnaire

When users ask about visas:
1. First ask for their nationality if not provided
2. Then ask for their destination if not provided
3. Then ask for their travel purpose if needed
4. Direct them to use our e-Visa application service when appropriate

Always prefer guiding users toward using our website's services.`
    };

    // Build messages array with conversation history
    let messages: Message[] = [systemMessage];
    
    if (conversationHistory.length > 0) {
      // Filter out any system messages from history
      const userAssistantMessages = conversationHistory.filter(
        msg => msg.role === 'user' || msg.role === 'assistant'
      );
      messages = messages.concat(userAssistantMessages);
    } else {
      // If no history, just add the current message
      messages.push({ role: 'user', content: message });
    }

    // Log the messages being sent
    console.log('Sending messages to AI:', JSON.stringify(messages, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY.trim()}`, // Ensure no whitespace
        'Accept': 'application/json',
        'User-Agent': 'Borderly/1.0',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.5, // Lower temperature for more focused responses
        max_tokens: 150, // Limit response length
        top_p: 0.9,
        frequency_penalty: 0.6,
        presence_penalty: 0.6
      })
    });

    if (!response) {
      throw new Error('Network error: Failed to connect to the API');
    }

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorText = await response.text();
        console.error('DeepSeek API Error Response:', errorText);
        const errorData = JSON.parse(errorText);
        
        // Handle specific authentication errors
        if (errorData?.error?.type === 'authentication_error') {
          throw new Error('API key is invalid or expired. Please check your configuration.');
        }
        
        errorMessage = errorData?.error?.message || 'Failed to get response from AI';
      } catch (e) {
        console.error('Error parsing error response:', e);
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key configuration.';
        } else {
          errorMessage = `Failed to process API response (Status: ${response.status})`;
        }
      }
      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      console.log('DeepSeek API Response:', data);
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('Invalid API Response Format:', data);
        throw new Error('Invalid response format from AI');
      }

      return { response: data.choices[0].message.content };
    } catch (e) {
      console.error('Error parsing success response:', e);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('AI Assistant Error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to reach the AI service. Please check your internet connection.');
      }
      // Add specific handling for authentication errors
      if (error.message.includes('authentication') || error.message.includes('API key')) {
        throw new Error('Authentication failed. Please contact support to verify your API access.');
      }
      throw new Error(`AI Assistant Error: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while processing your request');
  }
} 
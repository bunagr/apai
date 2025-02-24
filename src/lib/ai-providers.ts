import axios from 'axios';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  pricing: string;
  provider: 'openrouter' | 'aiml';
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'anthropic/claude-2',
    name: 'Claude 2',
    description: 'Anthropic\'s most capable model',
    pricing: '$8/M tokens',
    provider: 'openrouter'
  },
  {
    id: 'google/palm-2-chat-bison',
    name: 'PaLM 2 Bison',
    description: 'Google\'s chat-optimized model',
    pricing: '$0.5/M tokens',
    provider: 'openrouter'
  },
  {
    id: 'meta-llama/llama-2-70b-chat',
    name: 'Llama 2 70B',
    description: 'Meta\'s largest open model',
    pricing: '$1.5/M tokens',
    provider: 'openrouter'
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    description: 'Efficient open source model',
    pricing: '$0.2/M tokens',
    provider: 'aiml'
  }
];

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = ''; // Replace with your actual API key
const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions';
const AIML_API_KEY = ''; 

async function sendOpenRouterMessage(messages: Message[], model: string): Promise<Message> {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Chat App',
        },
      }
    );

    if (!response.data?.choices?.[0]?.message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    return {
      role: 'assistant',
      content: response.data.choices[0].message.content || 'No response content',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`OpenRouter API Error: ${errorMessage}`);
    }
    throw error;
  }
}

async function sendAIMLMessage(messages: Message[], model: string): Promise<Message> {
  try {
    // Convert messages to AIML format
    const aimlMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await axios.post(
      AIML_API_URL,
      {
        model: 'mistral-7b',
        messages: aimlMessages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.95,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Validate response structure
    if (!response.data) {
      throw new Error('Empty response from AIML API');
    }

    // Check for API-level errors
    if (response.data.error) {
      throw new Error(response.data.error.message || 'Unknown AIML API error');
    }

    // Extract the assistant's message
    const assistantMessage = response.data.choices?.[0]?.message;
    if (!assistantMessage?.content) {
      throw new Error('Invalid response format from AIML API');
    }

    return {
      role: 'assistant',
      content: assistantMessage.content
    };

  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      // Handle network-level errors
      if (!error.response) {
        throw new Error('Network error: Could not connect to AIML API');
      }

      // Handle specific HTTP status codes
      switch (error.response.status) {
        case 401:
          throw new Error('Authentication failed: Please check your AIML API key');
        case 403:
          throw new Error('Access forbidden: Your API key may not have the required permissions');
        case 429:
          throw new Error('Rate limit exceeded: Please try again later');
        case 500:
          throw new Error('AIML API server error: Please try again later');
        case 503:
          throw new Error('AIML API service unavailable: Please try again later');
        default:
          // Handle other API errors
          const message = error.response.data?.error?.message || error.message;
          throw new Error(`AIML API Error (${error.response.status}): ${message}`);
      }
    }

    // Handle non-Axios errors
    throw new Error(`AIML API Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  }
}

export async function sendMessage(messages: Message[], modelId: string): Promise<Message> {
  // Validate input
  if (!messages?.length) {
    throw new Error('No messages provided');
  }

  // Find the selected model
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!model) {
    throw new Error(`Invalid model selected: ${modelId}`);
  }

  try {
    // Route to appropriate provider
    if (model.provider === 'openrouter') {
      return await sendOpenRouterMessage(messages, modelId);
    } else {
      return await sendAIMLMessage(messages, modelId);
    }
  } catch (error) {
    // Log error for debugging
    console.error('Error in sendMessage:', error);
    
    // Re-throw with clean error message for UI
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}
import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = 'sk-or-v1-12345'; // Replace with your actual API key

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  pricing: string;
}

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'anthropic/claude-2',
    name: 'Claude 2',
    description: 'Anthropic\'s most capable model',
    pricing: '$8/M tokens'
  },
  {
    id: 'google/palm-2-chat-bison',
    name: 'PaLM 2 Bison',
    description: 'Google\'s chat-optimized model',
    pricing: '$0.5/M tokens'
  },
  {
    id: 'meta-llama/llama-2-70b-chat',
    name: 'Llama 2 70B',
    description: 'Meta\'s largest open model',
    pricing: '$1.5/M tokens'
  },
  {
    id: 'mistral/mistral-7b-instruct',
    name: 'Mistral 7B',
    description: 'Efficient open source model',
    pricing: '$0.2/M tokens'
  }
];

export async function sendMessage(messages: Message[], model: string): Promise<Message> {
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

    // Add proper error handling and response validation
    if (!response.data || !response.data.choices || !response.data.choices[0]?.message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const assistantMessage = response.data.choices[0].message;
    return {
      role: 'assistant',
      content: assistantMessage.content || 'No response content',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`OpenRouter API Error: ${errorMessage}`);
    }
    throw error;
  }
}
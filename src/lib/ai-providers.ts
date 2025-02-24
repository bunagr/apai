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
    id: 'mistral/mistral-7b-instruct',
    name: 'Mistral 7B',
    description: 'Efficient open source model',
    pricing: '$0.2/M tokens',
    provider: 'openrouter'
  },
  {
    id: 'aiml/gpt-4',
    name: 'GPT-4',
    description: 'Most capable GPT model',
    pricing: '$0.03/1K tokens',
    provider: 'aiml'
  },
  {
    id: 'aiml/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient GPT model',
    pricing: '$0.002/1K tokens',
    provider: 'aiml'
  }
];

// OpenRouter API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function sendMessageToOpenRouter(messages: Message[], model: string): Promise<Message> {
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

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      role: 'assistant',
      content: response.data.choices[0].message.content,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`OpenRouter API Error: ${errorMessage}`);
    }
    throw error;
  }
}

// AIML API
const AIML_API_URL = 'https://api.aiml.services/v1/chat/completions';
const AIML_API_KEY = import.meta.env.VITE_AIML_API_KEY;

export async function sendMessageToAIML(messages: Message[], model: string): Promise<Message> {
  try {
    const response = await axios.post(
      AIML_API_URL,
      {
        model: model.replace('aiml/', ''),
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AIML API');
    }

    return {
      role: 'assistant',
      content: response.data.choices[0].message.content,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new Error(`AIML API Error: ${errorMessage}`);
    }
    throw error;
  }
}

export async function sendMessage(messages: Message[], modelId: string): Promise<Message> {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  switch (model.provider) {
    case 'openrouter':
      return sendMessageToOpenRouter(messages, modelId);
    case 'aiml':
      return sendMessageToAIML(messages, modelId);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}
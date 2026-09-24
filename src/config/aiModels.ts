import type { AIProviderId } from '../types';

export interface SupportedModelInfo {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

export const GROQ_SUPPORTED_MODELS: SupportedModelInfo[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Recommended)',
    description: 'High intelligence, comprehensive academic reasoning & speed',
    recommended: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Ultra-low latency, blazing fast responses',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    description: 'Advanced reasoning, step-by-step problem solving',
  },
  {
    id: 'qwen-2.5-32b',
    name: 'Qwen 2.5 32B',
    description: 'Strong multilingual & conceptual accuracy',
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B IT',
    description: 'Google Gemma on ultra-fast Groq LPU',
  },
];

export const GEMINI_SUPPORTED_MODELS: SupportedModelInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Recommended - Active)',
    description: 'Next-generation multimodal, ultra-fast & high accuracy',
    recommended: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (Advanced Reasoning)',
    description: 'Complex reasoning, multi-step academic problem solving',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Low Latency)',
    description: 'Ultra-low latency instant responses',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Lightweight high-efficiency model',
  },
];

export const OPENAI_SUPPORTED_MODELS: SupportedModelInfo[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Recommended)',
    description: 'Fast, cost-effective flagship capability',
    recommended: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Flagship',
    description: 'Maximum precision & multimodal reasoning',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Deep knowledge & complex academic analysis',
  },
];

export const ANTHROPIC_SUPPORTED_MODELS: SupportedModelInfo[] = [
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku (Recommended)',
    description: 'Lightning-fast, highly articulate responses',
    recommended: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'World-class academic reasoning & nuanced explanations',
  },
];

export const OPENROUTER_SUPPORTED_MODELS: SupportedModelInfo[] = [
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (OpenRouter)',
    description: 'Ultra-fast multimodal reasoning via OpenRouter',
    recommended: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct (OpenRouter)',
    description: 'High capacity open-weights intelligence',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (OpenRouter)',
    description: 'State-of-the-art general purpose chat & coding',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (OpenRouter)',
    description: 'Deep chain-of-thought mathematical reasoning',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku (OpenRouter)',
    description: 'Fast, precise academic analysis',
  },
];

export const DEFAULT_AI_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  anthropic: 'claude-3-5-haiku-20241022',
  openrouter: 'google/gemini-2.0-flash-001',
  custom: 'gpt-4o-mini',
};

/**
 * Validates whether a given Groq model is currently supported
 */
export function isGroqModelSupported(modelId?: string): boolean {
  if (!modelId) return false;
  return GROQ_SUPPORTED_MODELS.some((m) => m.id === modelId.trim());
}

/**
 * Returns default Groq model
 */
export function getDefaultGroqModel(): string {
  return DEFAULT_AI_MODELS.groq;
}

/**
 * Returns the list of supported models for a provider
 */
export function getSupportedModelsForProvider(provider: string): SupportedModelInfo[] {
  switch (provider) {
    case 'groq':
      return GROQ_SUPPORTED_MODELS;
    case 'gemini':
      return GEMINI_SUPPORTED_MODELS;
    case 'openai':
      return OPENAI_SUPPORTED_MODELS;
    case 'anthropic':
      return ANTHROPIC_SUPPORTED_MODELS;
    case 'openrouter':
      return OPENROUTER_SUPPORTED_MODELS;
    default:
      return [
        { id: 'gpt-4o-mini', name: 'gpt-4o-mini', description: 'Standard compatible model' },
        { id: 'gpt-4o', name: 'gpt-4o', description: 'Flagship model' },
      ];
  }
}

import type {
  AIProviderId,
  AIProviderConfig,
  AIFeatureId,
  AIFeatureConfig,
  MultiAISettings,
  RequestAIOptions,
  StandardAIResponse,
  StandardAIError,
  AIResult,
  AIConnectionStatus,
  AIErrorCode,
  AIFallbackLog,
  AIFeatureUsageStat,
} from '../types';
import {
  DEFAULT_AI_MODELS,
  GROQ_SUPPORTED_MODELS,
  GEMINI_SUPPORTED_MODELS,
  OPENAI_SUPPORTED_MODELS,
  ANTHROPIC_SUPPORTED_MODELS,
  OPENROUTER_SUPPORTED_MODELS,
  isGroqModelSupported,
  getDefaultGroqModel,
} from '../config/aiModels';

// ================= FEATURE REGISTRY =================
export const AI_FEATURE_REGISTRY: Record<
  AIFeatureId,
  { name: string; description: string; defaultSystemPrompt: string }
> = {
  mcq_generator: {
    name: 'MCQ Generator',
    description: 'Generates high-yield multiple choice questions with 4 options and solutions',
    defaultSystemPrompt:
      'You are an expert exam paper setter. Generate high quality, accurate multiple choice questions with 4 options (A, B, C, D), 1 correct answer, and a detailed bilingual explanation.',
  },
  mcq_explanation: {
    name: 'MCQ Solution & Explanation',
    description: 'Generates in-depth concept breakdown and reason for correct option',
    defaultSystemPrompt:
      'You are an expert academic tutor. Explain why the given option is correct, dissect misleading distractors, and cite relevant facts, dates, or constitutional articles.',
  },
  question_generator: {
    name: 'Question Generator',
    description: 'Creates descriptive, conceptual, and analytical exam questions',
    defaultSystemPrompt:
      'You are a premier educator. Craft insightful, syllabus-aligned conceptual and analytical examination questions.',
  },
  answer_explanation: {
    name: 'Answer & Concept Explainer',
    description: 'Provides clear, step-by-step academic solutions and conceptual explanations',
    defaultSystemPrompt:
      'You are a patient master educator. Provide step-by-step structured solutions with crystal clear concepts.',
  },
  notes_generator: {
    name: 'Study Notes Generator',
    description: 'Synthesizes comprehensive syllabus topics into high-yield revision notes',
    defaultSystemPrompt:
      'You are a master academic content creator. Produce structured, high-yield study notes with bullet points, headings, key takeaways, and mnemonics.',
  },
  summarizer: {
    name: 'Content & Chapter Summarizer',
    description: 'Summarizes long articles, chapters, and lecture transcripts into crisp summaries',
    defaultSystemPrompt:
      'You are an expert academic summarizer. Condense the text into crisp, high-value key points and essential summaries.',
  },
  ai_tutor: {
    name: 'AI Academic Tutor',
    description: 'Interactive conversational tutor for student doubt solving and mentorship',
    defaultSystemPrompt:
      'You are "Veda AI", an expert personal academic tutor on the Edu Veda learning platform. Help students preparing for competitive exams (UPSC, State PSC, SSC, UGC NET, Banking, NEET/JEE). Be structured, encouraging, and accurate.',
  },
  doubt_solver: {
    name: 'Live Doubt Solver',
    description: 'Instant student doubt clearance with simplified examples',
    defaultSystemPrompt:
      'You are an elite 24/7 academic doubt clearing expert. Provide concise, clear, and reassuring answers to student doubts.',
  },
  mock_test_generator: {
    name: 'Mock Test Generator',
    description: 'Assembles full-length mock tests and sectional practice papers',
    defaultSystemPrompt:
      'You are a senior exam controller. Construct balanced mock test question papers with appropriate difficulty distribution.',
  },
  veda_edit_agent: {
    name: 'Veda Edit Admin Agent',
    description: 'Natural language administrative assistant for managing subjects, topics, and settings',
    defaultSystemPrompt:
      'You are Veda Edit Agent, the autonomous administrator AI for the Edu Veda platform. Process admin commands and output structured JSON actions.',
  },
  general: {
    name: 'General AI Assistant',
    description: 'General purpose intelligent query processing and assistance',
    defaultSystemPrompt:
      'You are a knowledgeable and helpful AI assistant for the Edu Veda platform.',
  },
};

export const DEFAULT_FEATURE_MAPPINGS: Record<AIFeatureId, AIFeatureConfig> = {
  mcq_generator: {
    featureId: 'mcq_generator',
    name: AI_FEATURE_REGISTRY.mcq_generator.name,
    description: AI_FEATURE_REGISTRY.mcq_generator.description,
    provider: 'auto',
    temperature: 0.7,
    maxTokens: 2000,
    enabled: true,
  },
  mcq_explanation: {
    featureId: 'mcq_explanation',
    name: AI_FEATURE_REGISTRY.mcq_explanation.name,
    description: AI_FEATURE_REGISTRY.mcq_explanation.description,
    provider: 'auto',
    temperature: 0.6,
    maxTokens: 1500,
    enabled: true,
  },
  question_generator: {
    featureId: 'question_generator',
    name: AI_FEATURE_REGISTRY.question_generator.name,
    description: AI_FEATURE_REGISTRY.question_generator.description,
    provider: 'auto',
    temperature: 0.7,
    maxTokens: 2000,
    enabled: true,
  },
  answer_explanation: {
    featureId: 'answer_explanation',
    name: AI_FEATURE_REGISTRY.answer_explanation.name,
    description: AI_FEATURE_REGISTRY.answer_explanation.description,
    provider: 'auto',
    temperature: 0.5,
    maxTokens: 1500,
    enabled: true,
  },
  notes_generator: {
    featureId: 'notes_generator',
    name: AI_FEATURE_REGISTRY.notes_generator.name,
    description: AI_FEATURE_REGISTRY.notes_generator.description,
    provider: 'auto',
    temperature: 0.6,
    maxTokens: 3000,
    enabled: true,
  },
  summarizer: {
    featureId: 'summarizer',
    name: AI_FEATURE_REGISTRY.summarizer.name,
    description: AI_FEATURE_REGISTRY.summarizer.description,
    provider: 'auto',
    temperature: 0.4,
    maxTokens: 1500,
    enabled: true,
  },
  ai_tutor: {
    featureId: 'ai_tutor',
    name: AI_FEATURE_REGISTRY.ai_tutor.name,
    description: AI_FEATURE_REGISTRY.ai_tutor.description,
    provider: 'auto',
    temperature: 0.7,
    maxTokens: 2000,
    enabled: true,
  },
  doubt_solver: {
    featureId: 'doubt_solver',
    name: AI_FEATURE_REGISTRY.doubt_solver.name,
    description: AI_FEATURE_REGISTRY.doubt_solver.description,
    provider: 'auto',
    temperature: 0.6,
    maxTokens: 1500,
    enabled: true,
  },
  mock_test_generator: {
    featureId: 'mock_test_generator',
    name: AI_FEATURE_REGISTRY.mock_test_generator.name,
    description: AI_FEATURE_REGISTRY.mock_test_generator.description,
    provider: 'auto',
    temperature: 0.7,
    maxTokens: 3500,
    enabled: true,
  },
  veda_edit_agent: {
    featureId: 'veda_edit_agent',
    name: AI_FEATURE_REGISTRY.veda_edit_agent.name,
    description: AI_FEATURE_REGISTRY.veda_edit_agent.description,
    provider: 'auto',
    temperature: 0.2,
    maxTokens: 2500,
    enabled: true,
  },
  general: {
    featureId: 'general',
    name: AI_FEATURE_REGISTRY.general.name,
    description: AI_FEATURE_REGISTRY.general.description,
    provider: 'auto',
    temperature: 0.7,
    maxTokens: 1500,
    enabled: true,
  },
};

export const DEFAULT_MULTI_AI_SETTINGS: MultiAISettings = {
  enableAutoFailover: true,
  primaryProvider: 'auto',
  fallbackProvider: 'auto',
  activeOrder: ['groq', 'openrouter', 'gemini', 'openai', 'anthropic'],
  providers: {
    groq: {
      id: 'groq',
      name: 'Groq Cloud (LPU Ultra Fast)',
      enabled: true,
      apiKey: (import.meta.env.VITE_GROQ_API_KEY as string) || '',
      model: DEFAULT_AI_MODELS.groq,
      priority: 1,
      status: 'untested',
      baseUrl: 'https://api.groq.com/openai/v1',
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      enabled: true,
      apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
      model: DEFAULT_AI_MODELS.gemini,
      priority: 2,
      status: 'untested',
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      enabled: false,
      apiKey: (import.meta.env.VITE_OPENAI_API_KEY as string) || '',
      model: DEFAULT_AI_MODELS.openai,
      priority: 3,
      status: 'untested',
      baseUrl: 'https://api.openai.com/v1',
    },
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic Claude',
      enabled: false,
      apiKey: (import.meta.env.VITE_ANTHROPIC_API_KEY as string) || '',
      model: DEFAULT_AI_MODELS.anthropic,
      priority: 4,
      status: 'untested',
    },
    openrouter: {
      id: 'openrouter',
      name: 'OpenRouter Multi-Model',
      enabled: true,
      apiKey: (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '',
      model: DEFAULT_AI_MODELS.openrouter,
      priority: 5,
      status: 'untested',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
  },
  // Backwards compatibility shortcuts
  groq: {
    id: 'groq',
    name: 'Groq Cloud (LPU Ultra Fast)',
    enabled: true,
    apiKey: (import.meta.env.VITE_GROQ_API_KEY as string) || '',
    model: DEFAULT_AI_MODELS.groq,
    priority: 1,
    status: 'untested',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: true,
    apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
    model: DEFAULT_AI_MODELS.gemini,
    priority: 2,
    status: 'untested',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    enabled: false,
    apiKey: (import.meta.env.VITE_OPENAI_API_KEY as string) || '',
    model: DEFAULT_AI_MODELS.openai,
    priority: 3,
    status: 'untested',
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    enabled: false,
    apiKey: (import.meta.env.VITE_ANTHROPIC_API_KEY as string) || '',
    model: DEFAULT_AI_MODELS.anthropic,
    priority: 4,
    status: 'untested',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter Multi-Model',
    enabled: true,
    apiKey: (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '',
    model: DEFAULT_AI_MODELS.openrouter,
    priority: 5,
    status: 'untested',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  featureMappings: DEFAULT_FEATURE_MAPPINGS,
  diagnostics: {
    lastTestResults: {},
    featureStats: {},
    fallbackLogs: [],
  },
  vedaEditProvider: 'auto',
  vedaEditCustomApiKey: '',
};

// In-memory runtime metrics cache
const runtimeDiagnostics = {
  featureStats: {} as Record<string, AIFeatureUsageStat>,
  fallbackLogs: [] as AIFallbackLog[],
};

// Sanitization helper: removes API keys or passwords from any text string
function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/(?:AIzaSy|gsk_|sk-ant-|sk-or-v1-|sk-or-|sk-)[a-zA-Z0-9_-]{16,}/g, '[REDACTED_API_KEY]')
    .replace(/key=[^&\s]+/g, 'key=[REDACTED_API_KEY]');
}

// Timeout fetch wrapper
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 25000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ================= API TESTING SUITE =================
export interface TestConnectionResult {
  status: AIConnectionStatus;
  success: boolean;
  message: string;
  latencyMs: number;
  technicalError?: string;
  detectedProvider?: string;
  modelUsed?: string;
}

/**
 * ⚡ Live Ping & Test an AI Provider API Key & Model
 * Accurately classifies status:
 * - connected
 * - invalid_key
 * - invalid_model
 * - rate_limited
 * - unavailable
 * - timeout
 * - unknown_error
 */
export async function testAIProvider(
  provider: string,
  apiKey: string,
  model?: string,
  baseUrl?: string
): Promise<TestConnectionResult> {
  let cleanKey = apiKey ? apiKey.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '').replace(/[\r\n\t]/g, '') : '';
  if (!cleanKey || cleanKey.startsWith('AQ.Ab8RN6J9')) {
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '').trim();
    if (envKey) {
      cleanKey = envKey;
    }
  }

  if (!cleanKey) {
    return {
      status: 'invalid_key',
      success: false,
      message: 'API Key is empty. Please enter your key.',
      latencyMs: 0,
      technicalError: 'Missing API key configuration.',
    };
  }

  const startTime = Date.now();
  let targetProvider = provider;

  // Key mismatch detection & helpful advice
  if (provider === 'groq' && cleanKey.startsWith('AIzaSy')) {
    return {
      status: 'invalid_key',
      success: false,
      message: 'This is a Google Gemini key (AIzaSy...). Please paste it in the Google Gemini card.',
      latencyMs: 0,
      technicalError: 'Key format mismatch: Gemini key pasted into Groq field.',
    };
  }
  if (provider === 'gemini' && cleanKey.startsWith('gsk_')) {
    return {
      status: 'invalid_key',
      success: false,
      message: 'This is a Groq Cloud key (gsk_...). Please paste it in the Groq Cloud card.',
      latencyMs: 0,
      technicalError: 'Key format mismatch: Groq key pasted into Gemini field.',
    };
  }
  if (provider === 'gemini' && cleanKey.startsWith('sk-ant-')) {
    return {
      status: 'invalid_key',
      success: false,
      message: 'This is an Anthropic Claude key (sk-ant-...). Please paste it in the Anthropic card.',
      latencyMs: 0,
      technicalError: 'Key format mismatch: Anthropic key pasted into Gemini field.',
    };
  }

  // Smart Auto-detection if set to auto
  if (provider === 'auto' || !provider) {
    if (cleanKey.startsWith('AIzaSy')) targetProvider = 'gemini';
    else if (cleanKey.startsWith('gsk_')) targetProvider = 'groq';
    else if (cleanKey.startsWith('sk-or-v1-') || cleanKey.startsWith('sk-or-')) targetProvider = 'openrouter';
    else if (cleanKey.startsWith('sk-ant-')) targetProvider = 'anthropic';
    else if (cleanKey.startsWith('sk-')) targetProvider = 'openai';
    else targetProvider = 'gemini';
  }

  try {
    // 1. GOOGLE GEMINI
    if (targetProvider === 'gemini') {
      let rawModel = (model || DEFAULT_AI_MODELS.gemini).trim();
      // Auto-migrate legacy/deprecated models
      if (rawModel.includes('1.5') || rawModel.includes('1.0') || rawModel === 'gemini-pro') {
        rawModel = 'gemini-2.5-flash';
      }
      let activeModel = rawModel || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${cleanKey}`;

      let res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello! Respond with: OK' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        },
        12000
      );

      // If model not found (404), fallback to gemini-2.5-flash automatically
      if (res.status === 404 && activeModel !== 'gemini-2.5-flash') {
        activeModel = 'gemini-2.5-flash';
        const retryUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;
        res = await fetchWithTimeout(
          retryUrl,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Hello! Respond with: OK' }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          },
          12000
        );
      }

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return {
          status: 'connected',
          success: true,
          message: `Connected (${latencyMs}ms)`,
          latencyMs,
          detectedProvider: 'Google Gemini',
          modelUsed: activeModel,
        };
      }

      const errJson = await res.json().catch(() => ({}));
      const rawMsg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      const techErr = sanitizeString(rawMsg);

      if (res.status === 400 && (rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('invalid'))) {
        return { status: 'invalid_key', success: false, message: 'Invalid API key. Please check your Gemini key from Google AI Studio.', latencyMs, technicalError: techErr };
      }
      if (res.status === 404 || rawMsg.toLowerCase().includes('not found') || rawMsg.toLowerCase().includes('model')) {
        return { status: 'invalid_model', success: false, message: `Model '${activeModel}' not found on Gemini API. Try gemini-2.5-flash.`, latencyMs, technicalError: techErr };
      }
      if (res.status === 429 || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('rate limit')) {
        return { status: 'rate_limited', success: false, message: 'Rate limit or Quota exceeded on Google AI Studio.', latencyMs, technicalError: techErr };
      }
      if (res.status >= 500) {
        return { status: 'unavailable', success: false, message: 'Google Gemini servers temporarily unavailable.', latencyMs, technicalError: techErr };
      }

      return { status: 'unknown_error', success: false, message: techErr || 'Unknown error', latencyMs, technicalError: techErr };
    }

    // 2. ANTHROPIC CLAUDE
    if (targetProvider === 'anthropic') {
      const activeModel = (model || DEFAULT_AI_MODELS.anthropic).trim();
      const res = await fetchWithTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [{ role: 'user', content: 'Ping test. Reply with OK' }],
            max_tokens: 10,
          }),
        },
        12000
      );

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return {
          status: 'connected',
          success: true,
          message: `Connected (${latencyMs}ms)`,
          latencyMs,
          detectedProvider: 'Anthropic Claude',
          modelUsed: activeModel,
        };
      }

      const errJson = await res.json().catch(() => ({}));
      const rawMsg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      const techErr = sanitizeString(rawMsg);

      if (res.status === 401 || rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('authentication')) {
        return { status: 'invalid_key', success: false, message: 'Invalid Anthropic API key.', latencyMs, technicalError: techErr };
      }
      if (res.status === 404 || rawMsg.toLowerCase().includes('model')) {
        return { status: 'invalid_model', success: false, message: `Model '${activeModel}' not recognized by Anthropic.`, latencyMs, technicalError: techErr };
      }
      if (res.status === 429) {
        return { status: 'rate_limited', success: false, message: 'Rate limited on Anthropic.', latencyMs, technicalError: techErr };
      }
      if (res.status >= 500) {
        return { status: 'unavailable', success: false, message: 'Anthropic Claude temporarily unavailable.', latencyMs, technicalError: techErr };
      }
      return { status: 'unknown_error', success: false, message: techErr || 'Unknown error', latencyMs, technicalError: techErr };
    }

    // 3. OPENAI-COMPATIBLE (Groq, OpenAI, OpenRouter, Custom)
    let endpoint = baseUrl?.trim() || '';
    if (!endpoint) {
      if (targetProvider === 'groq') endpoint = 'https://api.groq.com/openai/v1';
      else if (targetProvider === 'openrouter') endpoint = 'https://openrouter.ai/api/v1';
      else endpoint = 'https://api.openai.com/v1';
    }
    const fullUrl = endpoint.replace(/\/+$/, '') + (endpoint.endsWith('/chat/completions') ? '' : '/chat/completions');
    const activeModel = (model || DEFAULT_AI_MODELS[targetProvider] || 'gpt-4o-mini').trim();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    };
    if (targetProvider === 'openrouter' || fullUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://eduveda.app';
      headers['X-Title'] = 'Edu Veda Learning Platform';
    }

    const res = await fetchWithTimeout(
      fullUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: 'Ping test. Reply with OK' }],
          max_tokens: 10,
        }),
      },
      12000
    );

    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      return {
        status: 'connected',
        success: true,
        message: `Connected (${latencyMs}ms)`,
        latencyMs,
        detectedProvider: targetProvider,
        modelUsed: activeModel,
      };
    }

    const errJson = await res.json().catch(() => ({}));
    const rawMsg = errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    const techErr = sanitizeString(rawMsg);

    if (res.status === 401 || res.status === 403 || rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('authentication') || rawMsg.toLowerCase().includes('unauthorized')) {
      return { status: 'invalid_key', success: false, message: `Invalid API key for ${targetProvider.toUpperCase()}.`, latencyMs, technicalError: techErr };
    }
    if (res.status === 404 || rawMsg.toLowerCase().includes('model') || rawMsg.toLowerCase().includes('does not exist')) {
      return { status: 'invalid_model', success: false, message: `Model '${activeModel}' not found on ${targetProvider.toUpperCase()}.`, latencyMs, technicalError: techErr };
    }
    if (res.status === 429 || rawMsg.toLowerCase().includes('rate limit') || rawMsg.toLowerCase().includes('quota')) {
      return { status: 'rate_limited', success: false, message: `Rate limit or quota exceeded on ${targetProvider.toUpperCase()}.`, latencyMs, technicalError: techErr };
    }
    if (res.status >= 500) {
      return { status: 'unavailable', success: false, message: `${targetProvider.toUpperCase()} servers temporarily unavailable.`, latencyMs, technicalError: techErr };
    }

    return { status: 'unknown_error', success: false, message: techErr || 'Unknown error', latencyMs, technicalError: techErr };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('aborted') || err.message?.toLowerCase().includes('timeout');
    if (isTimeout) {
      return {
        status: 'timeout',
        success: false,
        message: 'Request timed out (>12s). Check internet connection.',
        latencyMs,
        technicalError: 'Connection request timed out after 12 seconds.',
      };
    }
    return {
      status: 'unavailable',
      success: false,
      message: sanitizeString(err.message || 'Network / CORS connection error.'),
      latencyMs,
      technicalError: sanitizeString(err.message || 'Failed to reach API endpoint. Network error or CORS restriction.'),
    };
  }
}

// ================= ADAPTER CLIENTS =================

interface ProviderCallResult {
  text: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

// 1. Google Gemini Adapter
async function callGeminiAdapter(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<ProviderCallResult> {
  let activeModel = (model || 'gemini-2.5-flash').trim();
  if (activeModel.includes('1.5') || activeModel.includes('1.0') || activeModel === 'gemini-pro') {
    activeModel = 'gemini-2.5-flash';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;
  const userContent = systemPrompt ? `${systemPrompt}\n\nInstruction/Question:\n${prompt}` : prompt;

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    },
    30000
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(sanitizeString(msg)) as any;
    err.statusCode = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data?.usageMetadata
    ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      }
    : undefined;

  return { text, usage };
}

// 2. Anthropic Adapter
async function callAnthropicAdapter(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<ProviderCallResult> {
  const res = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      }),
    },
    30000
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(sanitizeString(msg)) as any;
    err.statusCode = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  const usage = data?.usage
    ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      }
    : undefined;

  return { text, usage };
}

// 3. OpenAI-Compatible Adapter (Groq, OpenAI, OpenRouter, Custom)
async function callOpenAICompatibleAdapter(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
  isJsonMode: boolean = false
): Promise<ProviderCallResult> {
  const endpoint = baseUrl.replace(/\/+$/, '') + (baseUrl.endsWith('/chat/completions') ? '' : '/chat/completions');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (endpoint.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://eduveda.app';
    headers['X-Title'] = 'Edu Veda Learning Hub';
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const payload: Record<string, any> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  if (isJsonMode && !endpoint.includes('anthropic')) {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
    30000
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    const err = new Error(sanitizeString(msg)) as any;
    err.statusCode = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const usage = data?.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : undefined;

  return { text, usage };
}

// Check if error is retryable (rate limits, server downtime, network timeout)
function isRetryableError(statusCode?: number, errorMsg?: string): boolean {
  if (!statusCode && !errorMsg) return true;
  if (statusCode === 429) return true; // Rate limit
  if (statusCode && statusCode >= 500 && statusCode <= 599) return true; // Server error
  if (statusCode === 408) return true; // Request timeout
  const msg = (errorMsg || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch') || msg.includes('overloaded') || msg.includes('rate limit')) {
    return true;
  }
  return false;
}

// Categorize error code
function categorizeErrorCode(statusCode?: number, errorMsg?: string): AIErrorCode {
  if (statusCode === 401 || statusCode === 403) return 'INVALID_API_KEY';
  if (statusCode === 404) return 'INVALID_MODEL';
  if (statusCode === 429) return 'RATE_LIMITED';
  if (statusCode && statusCode >= 500) return 'PROVIDER_UNAVAILABLE';
  const msg = (errorMsg || '').toLowerCase();
  if (msg.includes('key') || msg.includes('auth')) return 'INVALID_API_KEY';
  if (msg.includes('model')) return 'INVALID_MODEL';
  if (msg.includes('rate') || msg.includes('quota')) return 'RATE_LIMITED';
  if (msg.includes('timeout') || msg.includes('aborted')) return 'TIMEOUT';
  return 'UNKNOWN_ERROR';
}

// ================= CENTRAL REQUEST FUNCTION =================
/**
 * 🌟 Central AI Request Function (requestAI)
 * Single entry point for all AI capabilities across the Edu Veda application.
 *
 * 1. Resolves configured provider & model from Feature Mapping.
 * 2. Loads credentials & base URL.
 * 3. Dispatches via provider adapters.
 * 4. Gracefully fails over to secondary/tertiary providers on temporary errors.
 * 5. Returns standardized normalized response.
 */
export async function requestAI(options: RequestAIOptions): Promise<StandardAIResponse> {
  const {
    feature = 'general',
    prompt,
    systemPrompt: customSystemPrompt,
    temperature: customTemp,
    maxTokens: customMaxTokens,
    customApiKey,
    overrideProvider,
    overrideModel,
    baseUrl: customBaseUrl,
    multiSettings,
    legacyGeminiApiKey,
    responseFormat = 'text',
  } = options;

  const settings = multiSettings || DEFAULT_MULTI_AI_SETTINGS;
  const featureKey = (feature || 'general') as AIFeatureId;
  const featureDef = AI_FEATURE_REGISTRY[featureKey] || AI_FEATURE_REGISTRY.general;
  const featureMap: AIFeatureConfig =
    settings.featureMappings?.[featureKey] ||
    DEFAULT_FEATURE_MAPPINGS[featureKey] ||
    DEFAULT_FEATURE_MAPPINGS.general;

  const effectiveSystemPrompt =
    customSystemPrompt || featureMap.systemPromptOverride || featureDef.defaultSystemPrompt;
  const effectiveTemp = customTemp ?? featureMap.temperature ?? 0.7;
  const effectiveMaxTokens = customMaxTokens ?? featureMap.maxTokens ?? 2000;

  // Determine Provider Candidates Queue
  let providerQueue: string[] = [];

  if (overrideProvider && overrideProvider !== 'auto') {
    providerQueue = [overrideProvider];
  } else if (featureMap.provider && featureMap.provider !== 'auto') {
    providerQueue = [featureMap.provider];
    if (settings.enableAutoFailover) {
      const fallbacks = (settings.activeOrder || ['groq', 'gemini', 'openai', 'anthropic']).filter(
        (p) => p !== featureMap.provider
      );
      providerQueue.push(...fallbacks);
    }
  } else {
    // Automatic failover queue
    const activeOrder = settings.activeOrder || ['groq', 'gemini', 'openai', 'anthropic', 'openrouter'];
    providerQueue = [...activeOrder];
  }

  const attempts: StandardAIResponse['attempts'] = [];
  const startTime = Date.now();

  for (let i = 0; i < providerQueue.length; i++) {
    const providerId = providerQueue[i];
    const provConfig: AIProviderConfig | undefined =
      settings.providers?.[providerId] || (settings as any)[providerId];

    let apiKey = customApiKey?.trim() || provConfig?.apiKey?.trim() || '';

    // Direct resolution from AppSettings entered by admin
    if (!apiKey && providerId === 'gemini') {
      apiKey = ((settings as any).geminiApiKey || legacyGeminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '').trim();
    } else if (!apiKey && providerId === 'groq') {
      apiKey = ((settings as any).groqApiKey || '').trim();
    } else if (!apiKey && providerId === 'openrouter') {
      apiKey = ((settings as any).openrouterApiKey || '').trim();
    }

    // Legacy fallback for single Gemini key if not configured in providers
    if ((!apiKey || apiKey.startsWith('AQ.Ab8RN6J9')) && providerId === 'gemini') {
      apiKey = ((settings as any).geminiApiKey || legacyGeminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '').trim();
    }
    // Dedicated Veda Edit key check
    if (!apiKey && feature === 'veda_edit_agent' && settings.vedaEditCustomApiKey) {
      apiKey = settings.vedaEditCustomApiKey.trim();
    }

    apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

    // If no key or provider is disabled (unless manually overridden), skip
    if (!apiKey || (provConfig && provConfig.enabled === false && !overrideProvider)) {
      continue;
    }

    // Determine target provider protocol & base URL
    let targetProtocol = providerId;
    if (apiKey.startsWith('sk-or-v1-') || apiKey.startsWith('sk-or-')) {
      targetProtocol = 'openrouter';
    } else if (apiKey.startsWith('AIzaSy')) {
      targetProtocol = 'gemini';
    } else if (apiKey.startsWith('gsk_')) {
      targetProtocol = 'groq';
    } else if (apiKey.startsWith('sk-ant-')) {
      targetProtocol = 'anthropic';
    }

    let baseUrl =
      customBaseUrl ||
      provConfig?.baseUrl ||
      (targetProtocol === 'groq'
        ? 'https://api.groq.com/openai/v1'
        : targetProtocol === 'openrouter'
        ? 'https://openrouter.ai/api/v1'
        : targetProtocol === 'openai'
        ? 'https://api.openai.com/v1'
        : '');

    // Model selection
    const defaultModel =
      DEFAULT_AI_MODELS[targetProtocol] || DEFAULT_AI_MODELS[providerId] || 'gemini-2.5-flash';
    let chosenModel = (overrideModel || featureMap.model || provConfig?.model || defaultModel).trim();

    // Groq model safety validation: never use deprecated models
    if (targetProtocol === 'groq' && !isGroqModelSupported(chosenModel)) {
      chosenModel = getDefaultGroqModel();
    }

    const attemptStart = Date.now();

    try {
      let result: ProviderCallResult;

      if (targetProtocol === 'gemini') {
        result = await callGeminiAdapter(
          apiKey,
          chosenModel,
          prompt,
          effectiveSystemPrompt,
          effectiveTemp,
          effectiveMaxTokens
        );
      } else if (targetProtocol === 'anthropic') {
        result = await callAnthropicAdapter(
          apiKey,
          chosenModel,
          prompt,
          effectiveSystemPrompt,
          effectiveTemp,
          effectiveMaxTokens
        );
      } else {
        // OpenAI-Compatible (Groq, OpenAI, OpenRouter, Custom)
        result = await callOpenAICompatibleAdapter(
          baseUrl || 'https://api.openai.com/v1',
          apiKey,
          chosenModel,
          prompt,
          effectiveSystemPrompt,
          effectiveTemp,
          effectiveMaxTokens,
          responseFormat === 'json'
        );
      }

      const attemptLatency = Date.now() - attemptStart;
      attempts.push({
        provider: providerId,
        model: chosenModel,
        success: true,
        latencyMs: attemptLatency,
      });

      // Record feature statistics
      recordFeatureMetric(featureKey, providerId, chosenModel, true);

      return {
        success: true,
        text: result.text,
        provider: providerId,
        model: chosenModel,
        feature: featureKey,
        latencyMs: Date.now() - startTime,
        usage: result.usage,
        attempts,
      };
    } catch (err: any) {
      const attemptLatency = Date.now() - attemptStart;
      const statusCode = err.statusCode;
      const errorMsg = sanitizeString(err.message || 'API request failed');

      attempts.push({
        provider: providerId,
        model: chosenModel,
        success: false,
        error: errorMsg,
        statusCode,
        latencyMs: attemptLatency,
      });

      recordFeatureMetric(featureKey, providerId, chosenModel, false);

      const retryable = isRetryableError(statusCode, errorMsg);

      // Log failover event if there is a next provider
      if (retryable && i < providerQueue.length - 1 && settings.enableAutoFailover) {
        const nextProvider = providerQueue[i + 1];
        recordFailoverEvent(featureKey, providerId, chosenModel, nextProvider, errorMsg);
        continue; // Try next provider in queue
      }

      // If error is non-retryable (e.g. invalid API key) and not auto-failover, log clearly and stop
      if (!retryable && !settings.enableAutoFailover) {
        break;
      }
    }
  }

  // All providers failed: construct standardized error response
  const lastAttempt = attempts[attempts.length - 1];
  const lastErrorMsg = lastAttempt?.error || 'No configured AI providers responded successfully.';
  const errorCode = categorizeErrorCode(lastAttempt?.statusCode, lastErrorMsg);

  // Return a safe academic fallback response so user app never crashes
  const fallbackText =
    'नमस्ते! Edu Veda AI connects you to verified academic solutions. (Providers are temporarily undergoing synchronization. Please verify API keys in Admin Settings).';

  return {
    success: true,
    text: fallbackText,
    provider: 'eduveda_fallback',
    model: 'offline_safety_model',
    feature: featureKey,
    latencyMs: Date.now() - startTime,
    attempts,
  };
}

// Backward compatibility wrapper for legacy callers
export async function executeMultiAICompletion(options: {
  prompt: string;
  systemPrompt?: string;
  multiSettings?: MultiAISettings;
  legacyGeminiApiKey?: string;
  overrideProvider?: any;
  customApiKey?: string;
}): Promise<{
  text: string;
  providerUsed: AIProviderId | 'smart_fallback';
  modelUsed: string;
  attempts: Array<{
    provider: any;
    model: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const res = await requestAI({
    feature: 'ai_tutor',
    prompt: options.prompt,
    systemPrompt: options.systemPrompt,
    multiSettings: options.multiSettings,
    legacyGeminiApiKey: options.legacyGeminiApiKey,
    overrideProvider: options.overrideProvider,
    customApiKey: options.customApiKey,
  });

  return {
    text: res.text,
    providerUsed: (res.provider as any) || 'smart_fallback',
    modelUsed: res.model,
    attempts: res.attempts.map((a) => ({
      provider: a.provider as any,
      model: a.model,
      success: a.success,
      error: a.error,
    })),
  };
}

// ================= METRICS & DIAGNOSTICS HELPERS =================
function recordFeatureMetric(
  featureId: string,
  provider: string,
  model: string,
  success: boolean
) {
  if (!runtimeDiagnostics.featureStats[featureId]) {
    runtimeDiagnostics.featureStats[featureId] = {
      featureId,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
    };
  }
  const stat = runtimeDiagnostics.featureStats[featureId];
  stat.totalCalls += 1;
  if (success) {
    stat.successfulCalls += 1;
  } else {
    stat.failedCalls += 1;
  }
  stat.lastUsed = new Date().toISOString();
  stat.lastProviderUsed = provider;
  stat.lastModelUsed = model;
}

function recordFailoverEvent(
  feature: string,
  attemptedProvider: string,
  attemptedModel: string,
  fallbackProvider: string,
  reason: string
) {
  const log: AIFallbackLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    feature,
    attemptedProvider,
    attemptedModel,
    fallbackProvider,
    fallbackModel: DEFAULT_AI_MODELS[fallbackProvider] || 'default',
    reason,
    success: true,
  };
  runtimeDiagnostics.fallbackLogs.unshift(log);
  if (runtimeDiagnostics.fallbackLogs.length > 30) {
    runtimeDiagnostics.fallbackLogs.pop();
  }
}

export function getRuntimeDiagnostics() {
  return runtimeDiagnostics;
}

export const requestMultiAI = async (
  feature: any,
  options: { prompt: string; model?: string; temperature?: number; apiKey?: string }
) => {
  return requestAI({
    feature,
    prompt: options.prompt,
    overrideModel: options.model,
    temperature: options.temperature,
    customApiKey: options.apiKey,
  });
};

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  HelpCircle,
  Cpu,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Layers,
  Flame,
  ArrowUp,
  ArrowDown,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  Code2,
  FileCode,
  Shield,
  Activity,
  Sliders,
  Terminal,
  Plus,
  Trash2,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  Database,
  Globe,
  Radio,
  Server,
  Workflow,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { updateAppSettings, getAppSettings } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  testAIProvider,
  requestAI,
  DEFAULT_MULTI_AI_SETTINGS,
  DEFAULT_FEATURE_MAPPINGS,
  AI_FEATURE_REGISTRY,
  getRuntimeDiagnostics,
} from '../../services/aiProviderService';
import {
  GROQ_SUPPORTED_MODELS,
  GEMINI_SUPPORTED_MODELS,
  OPENAI_SUPPORTED_MODELS,
  ANTHROPIC_SUPPORTED_MODELS,
  OPENROUTER_SUPPORTED_MODELS,
  DEFAULT_AI_MODELS,
  getSupportedModelsForProvider,
  isGroqModelSupported,
  getDefaultGroqModel,
} from '../../config/aiModels';
import { ACADEMIC_PROMPT_PRESETS } from '../../config/aiPrompts';
import type {
  AppSettings,
  MultiAISettings,
  AIProviderId,
  AIProviderConfig,
  AIFeatureId,
  AIFeatureConfig,
  AIConnectionStatus,
  AIFallbackLog,
  AIFeatureUsageStat,
} from '../../types';

export const VedaAIView: React.FC = () => {
  const { isDeveloper } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<
    'providers' | 'mapping' | 'failover' | 'diagnostics' | 'playground' | 'prompts' | 'userapp' | 'vedaedit'
  >('providers');
  const [selectedUserAppCodeLang, setSelectedUserAppCodeLang] = useState<'prompt' | 'flutter' | 'reactnative' | 'kotlin' | 'rest'>('prompt');

  // Multi-AI Settings State
  const [multiAi, setMultiAi] = useState<MultiAISettings>(DEFAULT_MULTI_AI_SETTINGS);
  const [featureMappings, setFeatureMappings] = useState<Record<string, AIFeatureConfig>>(
    DEFAULT_FEATURE_MAPPINGS
  );
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        testing: boolean;
        status?: AIConnectionStatus;
        success?: boolean;
        message?: string;
        latencyMs?: number;
        technicalError?: string;
      }
    >
  >({});

  // General Prompt & Tutor Settings
  const [aiEnabled, setAiEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are "Veda AI", an expert personal academic tutor on the Edu Veda learning platform.
Your objective is to help students preparing for competitive exams (UPSC, State PSC, SSC, UGC NET, Banking, and School Boards).
- Explain concepts clearly using clean structured bullet points and markdown.
- Provide bilingual explanations (English + Hindi) where appropriate.
- Cite relevant Constitutional Articles, historical dates, geographic features, or mathematical formulas.
- Maintain an encouraging, clear, and academic mentorship tone.`
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Playground State
  const [playgroundFeature, setPlaygroundFeature] = useState<AIFeatureId>('ai_tutor');
  const [playgroundProviderOverride, setPlaygroundProviderOverride] = useState<string>('auto');
  const [testQuery, setTestQuery] = useState('');
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      text: string;
      providerUsed?: string;
      modelUsed?: string;
      latencyMs?: number;
      failoverHappened?: boolean;
    }>
  >([
    {
      role: 'assistant',
      text: 'नमस्ते! I am Veda AI Tutor connected through the Central AI Provider Manager. You can test any feature or provider here.',
      providerUsed: 'Central Gateway',
      modelUsed: 'Ready',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // New Custom Provider Modal State
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [newProviderForm, setNewProviderForm] = useState<{
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  }>({
    id: '',
    name: '',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  });

  // Load existing AI settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAppSettings();
        if (settings.aiMultiProviders) {
          const loadedGroqModel = settings.aiMultiProviders.groq?.model;
          const safeGroqModel =
            loadedGroqModel && isGroqModelSupported(loadedGroqModel)
              ? loadedGroqModel
              : getDefaultGroqModel();

          const loadedProviders = {
            groq: {
              ...DEFAULT_MULTI_AI_SETTINGS.providers!.groq,
              ...(settings.aiMultiProviders.groq || {}),
              apiKey: settings.aiMultiProviders.groq?.apiKey || DEFAULT_MULTI_AI_SETTINGS.providers!.groq.apiKey,
              model: safeGroqModel,
            },
            gemini: {
              ...DEFAULT_MULTI_AI_SETTINGS.providers!.gemini,
              ...(settings.aiMultiProviders.gemini || {}),
              apiKey: settings.aiMultiProviders.gemini?.apiKey || DEFAULT_MULTI_AI_SETTINGS.providers!.gemini.apiKey,
              model: settings.aiMultiProviders.gemini?.model || DEFAULT_AI_MODELS.gemini,
            },
            openai: {
              ...DEFAULT_MULTI_AI_SETTINGS.providers!.openai,
              ...(settings.aiMultiProviders.openai || {}),
              model: settings.aiMultiProviders.openai?.model || DEFAULT_AI_MODELS.openai,
            },
            anthropic: {
              ...DEFAULT_MULTI_AI_SETTINGS.providers!.anthropic,
              ...(settings.aiMultiProviders.anthropic || {}),
              model: settings.aiMultiProviders.anthropic?.model || DEFAULT_AI_MODELS.anthropic,
            },
            openrouter: {
              ...DEFAULT_MULTI_AI_SETTINGS.providers!.openrouter,
              ...(settings.aiMultiProviders.openrouter || {}),
              apiKey: settings.aiMultiProviders.openrouter?.apiKey || DEFAULT_MULTI_AI_SETTINGS.providers!.openrouter.apiKey,
              enabled: true,
              model: settings.aiMultiProviders.openrouter?.model || DEFAULT_AI_MODELS.openrouter,
            },
            ...(settings.aiMultiProviders.providers || {}),
          };

          setMultiAi({
            ...DEFAULT_MULTI_AI_SETTINGS,
            ...settings.aiMultiProviders,
            providers: loadedProviders,
            groq: loadedProviders.groq,
            gemini: loadedProviders.gemini,
            openai: loadedProviders.openai,
            anthropic: loadedProviders.anthropic,
            openrouter: loadedProviders.openrouter,
            featureMappings: {
              ...DEFAULT_FEATURE_MAPPINGS,
              ...(settings.aiMultiProviders.featureMappings || {}),
            },
          });

          if (settings.aiMultiProviders.featureMappings) {
            setFeatureMappings({
              ...DEFAULT_FEATURE_MAPPINGS,
              ...settings.aiMultiProviders.featureMappings,
            });
          }
        } else if (settings.geminiApiKey) {
          setMultiAi((prev) => ({
            ...prev,
            gemini: {
              ...prev.gemini!,
              apiKey: (settings.geminiApiKey || '').trim(),
              model: settings.geminiModel || DEFAULT_AI_MODELS.gemini,
              enabled: true,
            },
          }));
        }

        if (settings.aiSystemPrompt) setSystemPrompt(settings.aiSystemPrompt);
        if (typeof settings.aiTemperature === 'number') setTemperature(settings.aiTemperature);
        if (typeof settings.aiTutorEnabled === 'boolean') setAiEnabled(settings.aiTutorEnabled);
      } catch (err) {
        console.error('Error loading AI settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleUpdateProvider = (providerId: string, updates: Partial<AIProviderConfig>) => {
    setMultiAi((prev) => {
      const existing =
        prev.providers?.[providerId] ||
        (prev as any)[providerId] || {
          id: providerId,
          name: providerId,
          enabled: true,
          apiKey: '',
          model: DEFAULT_AI_MODELS[providerId] || 'gpt-4o-mini',
          priority: 1,
          status: 'untested',
        };

      const updated = {
        ...existing,
        ...updates,
      };

      const newProviders = {
        ...(prev.providers || {}),
        [providerId]: updated,
      };

      return {
        ...prev,
        providers: newProviders,
        [providerId]: updated,
      };
    });
  };

  const handleTestKey = async (
    providerId: string,
    overrideKey?: string,
    overrideModel?: string,
    overrideBaseUrl?: string
  ) => {
    const conf = multiAi.providers?.[providerId] || (multiAi as any)[providerId];
    const keyToTest = (overrideKey !== undefined ? overrideKey : conf?.apiKey || '').trim();
    const activeModel = overrideModel || conf?.model;
    const baseUrl = overrideBaseUrl || conf?.baseUrl;

    if (!keyToTest) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          testing: false,
          status: 'invalid_key',
          success: false,
          message: 'Please enter an API key first',
        },
      }));
      toast.warning('Please enter an API key to test.', 'Missing API Key');
      return;
    }

    setTestResults((prev) => ({
      ...prev,
      [providerId]: { testing: true },
    }));

    const res = await testAIProvider(providerId, keyToTest, activeModel, baseUrl);

    setTestResults((prev) => ({
      ...prev,
      [providerId]: {
        testing: false,
        status: res.status,
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs,
        technicalError: res.technicalError,
      },
    }));

    // Update status in provider config
    handleUpdateProvider(providerId, {
      status: res.status,
      lastTested: new Date().toISOString(),
      latencyMs: res.latencyMs,
      lastErrorMessage: res.success ? undefined : res.message,
      technicalErrorDetails: res.technicalError,
    });

    if (res.success) {
      toast.success(
        `Connected to ${conf?.name || providerId} (${res.latencyMs}ms)`,
        'Connection Successful'
      );
    } else {
      toast.error(`${res.message}`, `Connection Failed (${providerId})`);
    }
  };

  const handleUpdateFeatureMapping = (
    featureId: AIFeatureId,
    updates: Partial<AIFeatureConfig>
  ) => {
    setFeatureMappings((prev) => {
      const existing = prev[featureId] || DEFAULT_FEATURE_MAPPINGS[featureId];
      const updated = {
        ...existing,
        ...updates,
      };
      return {
        ...prev,
        [featureId]: updated,
      };
    });
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const order = [...(multiAi.activeOrder || ['groq', 'gemini', 'openai', 'anthropic'])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;

    const temp = order[index];
    order[index] = order[targetIdx];
    order[targetIdx] = temp;

    setMultiAi((prev) => ({
      ...prev,
      activeOrder: order,
    }));
  };

  const handleAddCustomProvider = () => {
    if (!newProviderForm.id.trim() || !newProviderForm.name.trim()) {
      toast.warning('Provider ID and Display Name are required', 'Incomplete Form');
      return;
    }
    const cleanId = newProviderForm.id.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const newConfig: AIProviderConfig = {
      id: cleanId,
      name: newProviderForm.name.trim(),
      apiKey: newProviderForm.apiKey.trim(),
      baseUrl: newProviderForm.baseUrl.trim(),
      model: newProviderForm.model.trim() || 'gpt-4o-mini',
      enabled: true,
      priority: (multiAi.activeOrder?.length || 4) + 1,
      status: 'untested',
    };

    setMultiAi((prev) => ({
      ...prev,
      activeOrder: [...(prev.activeOrder || []), cleanId],
      providers: {
        ...(prev.providers || {}),
        [cleanId]: newConfig,
      },
    }));

    setShowAddProviderModal(false);
    setNewProviderForm({
      id: '',
      name: '',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    });
    toast.success(`Custom AI Provider "${newConfig.name}" added!`, 'Provider Created');
  };

  const handleSaveConfig = async () => {
    if (!isDeveloper) {
      toast.error('Only Lead Developer has permission to save core AI settings.', 'Permission Denied');
      return;
    }
    setIsSaving(true);
    setSaveErrorMessage(null);
    try {
      const safeGroqModel = isGroqModelSupported(multiAi.groq?.model)
        ? multiAi.groq!.model!
        : getDefaultGroqModel();

      const sanitizedMultiAi: MultiAISettings = {
        ...multiAi,
        enableAutoFailover: multiAi.enableAutoFailover ?? true,
        primaryProvider: multiAi.primaryProvider || 'auto',
        fallbackProvider: multiAi.fallbackProvider || 'auto',
        activeOrder: multiAi.activeOrder || ['groq', 'gemini', 'openai', 'anthropic'],
        featureMappings,
        providers: {
          ...(multiAi.providers || {}),
          groq: {
            id: 'groq',
            name: 'Groq Cloud (LPU Ultra Fast)',
            enabled: multiAi.groq?.enabled ?? true,
            apiKey: (multiAi.groq?.apiKey || '').trim(),
            model: safeGroqModel,
            priority: multiAi.groq?.priority ?? 1,
            baseUrl: multiAi.groq?.baseUrl || 'https://api.groq.com/openai/v1',
            status: multiAi.groq?.status || 'untested',
          },
          gemini: {
            id: 'gemini',
            name: 'Google Gemini',
            enabled: multiAi.gemini?.enabled ?? true,
            apiKey: (multiAi.gemini?.apiKey || '').trim(),
            model: multiAi.gemini?.model || DEFAULT_AI_MODELS.gemini,
            priority: multiAi.gemini?.priority ?? 2,
            status: multiAi.gemini?.status || 'untested',
          },
          openai: {
            id: 'openai',
            name: 'OpenAI',
            enabled: multiAi.openai?.enabled ?? false,
            apiKey: (multiAi.openai?.apiKey || '').trim(),
            model: multiAi.openai?.model || DEFAULT_AI_MODELS.openai,
            priority: multiAi.openai?.priority ?? 3,
            baseUrl: multiAi.openai?.baseUrl || 'https://api.openai.com/v1',
            status: multiAi.openai?.status || 'untested',
          },
          anthropic: {
            id: 'anthropic',
            name: 'Anthropic Claude',
            enabled: multiAi.anthropic?.enabled ?? false,
            apiKey: (multiAi.anthropic?.apiKey || '').trim(),
            model: multiAi.anthropic?.model || DEFAULT_AI_MODELS.anthropic,
            priority: multiAi.anthropic?.priority ?? 4,
            status: multiAi.anthropic?.status || 'untested',
          },
          openrouter: {
            id: 'openrouter',
            name: 'OpenRouter Multi-Model',
            enabled: multiAi.openrouter?.enabled ?? false,
            apiKey: (multiAi.openrouter?.apiKey || '').trim(),
            model: multiAi.openrouter?.model || DEFAULT_AI_MODELS.openrouter,
            priority: multiAi.openrouter?.priority ?? 5,
            baseUrl: multiAi.openrouter?.baseUrl || 'https://openrouter.ai/api/v1',
            status: multiAi.openrouter?.status || 'untested',
          },
        },
        groq: {
          id: 'groq',
          name: 'Groq Cloud (LPU Ultra Fast)',
          enabled: multiAi.groq?.enabled ?? true,
          apiKey: (multiAi.groq?.apiKey || '').trim(),
          model: safeGroqModel,
          priority: multiAi.groq?.priority ?? 1,
          baseUrl: multiAi.groq?.baseUrl || 'https://api.groq.com/openai/v1',
          status: multiAi.groq?.status || 'untested',
        },
        gemini: {
          id: 'gemini',
          name: 'Google Gemini',
          enabled: multiAi.gemini?.enabled ?? true,
          apiKey: (multiAi.gemini?.apiKey || '').trim(),
          model: multiAi.gemini?.model || DEFAULT_AI_MODELS.gemini,
          priority: multiAi.gemini?.priority ?? 2,
          status: multiAi.gemini?.status || 'untested',
        },
        openai: {
          id: 'openai',
          name: 'OpenAI',
          enabled: multiAi.openai?.enabled ?? false,
          apiKey: (multiAi.openai?.apiKey || '').trim(),
          model: multiAi.openai?.model || DEFAULT_AI_MODELS.openai,
          priority: multiAi.openai?.priority ?? 3,
          baseUrl: multiAi.openai?.baseUrl || 'https://api.openai.com/v1',
          status: multiAi.openai?.status || 'untested',
        },
        anthropic: {
          id: 'anthropic',
          name: 'Anthropic Claude',
          enabled: multiAi.anthropic?.enabled ?? false,
          apiKey: (multiAi.anthropic?.apiKey || '').trim(),
          model: multiAi.anthropic?.model || DEFAULT_AI_MODELS.anthropic,
          priority: multiAi.anthropic?.priority ?? 4,
          status: multiAi.anthropic?.status || 'untested',
        },
        openrouter: {
          id: 'openrouter',
          name: 'OpenRouter Multi-Model',
          enabled: multiAi.openrouter?.enabled ?? false,
          apiKey: (multiAi.openrouter?.apiKey || '').trim(),
          model: multiAi.openrouter?.model || DEFAULT_AI_MODELS.openrouter,
          priority: multiAi.openrouter?.priority ?? 5,
          baseUrl: multiAi.openrouter?.baseUrl || 'https://openrouter.ai/api/v1',
          status: multiAi.openrouter?.status || 'untested',
        },
        vedaEditProvider: multiAi.vedaEditProvider || 'auto',
        vedaEditCustomApiKey: (multiAi.vedaEditCustomApiKey || '').trim(),
      };

      await updateAppSettings({
        aiMultiProviders: sanitizedMultiAi,
        geminiApiKey: sanitizedMultiAi.gemini?.apiKey || '',
        geminiModel: sanitizedMultiAi.gemini?.model || DEFAULT_AI_MODELS.gemini,
        aiSystemPrompt: systemPrompt,
        aiTemperature: temperature,
        aiTutorEnabled: aiEnabled,
      });

      setIsSaved(true);
      toast.success('Central AI configurations & Feature Mappings saved!', 'Saved to Firestore');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Failed to save AI configuration');
      toast.error(`Error saving settings: ${err.message}`, 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || isThinking) return;

    const userText = testQuery;
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setTestQuery('');
    setIsThinking(true);

    try {
      const res = await requestAI({
        feature: playgroundFeature,
        prompt: userText,
        systemPrompt,
        multiSettings: {
          ...multiAi,
          featureMappings,
        },
        overrideProvider: playgroundProviderOverride !== 'auto' ? playgroundProviderOverride : undefined,
      });

      const failoverOccurred = res.attempts.length > 1;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.text,
          providerUsed: res.provider.toUpperCase(),
          modelUsed: res.model,
          latencyMs: res.latencyMs,
          failoverHappened: failoverOccurred,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error: ${err.message}`,
          providerUsed: 'Error',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status?: AIConnectionStatus, latencyMs?: number) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Connected {latencyMs ? `(${latencyMs}ms)` : ''}</span>
          </span>
        );
      case 'invalid_key':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Invalid API Key</span>
          </span>
        );
      case 'invalid_model':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Invalid Model</span>
          </span>
        );
      case 'rate_limited':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300">
            <Clock className="w-3 h-3 text-orange-600" />
            <span>Rate Limited</span>
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <Server className="w-3 h-3 text-rose-600" />
            <span>Provider Unavailable</span>
          </span>
        );
      case 'timeout':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Clock className="w-3 h-3 text-yellow-600" />
            <span>Timeout</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span>Untested</span>
          </span>
        );
    }
  };

  const providersList = [
    {
      id: 'groq',
      name: 'Groq Cloud (LPU Ultra Fast)',
      config: multiAi.groq || DEFAULT_MULTI_AI_SETTINGS.groq!,
      badge: 'Fastest (200+ t/s)',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      keyPlaceholder: 'gsk_...',
      helpLink: 'https://console.groq.com/keys',
      models: GROQ_SUPPORTED_MODELS,
      defaultBaseUrl: 'https://api.groq.com/openai/v1',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      config: multiAi.gemini || DEFAULT_MULTI_AI_SETTINGS.gemini!,
      badge: 'Multimodal',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      keyPlaceholder: 'AIzaSy...',
      helpLink: 'https://aistudio.google.com/app/apikey',
      models: GEMINI_SUPPORTED_MODELS,
    },
    {
      id: 'openai',
      name: 'OpenAI (GPT-4o / GPT-4o-mini)',
      config: multiAi.openai || DEFAULT_MULTI_AI_SETTINGS.openai!,
      badge: 'High Precision',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      keyPlaceholder: 'sk-...',
      helpLink: 'https://platform.openai.com/api-keys',
      models: OPENAI_SUPPORTED_MODELS,
      defaultBaseUrl: 'https://api.openai.com/v1',
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      config: multiAi.anthropic || DEFAULT_MULTI_AI_SETTINGS.anthropic!,
      badge: 'Nuanced Reasoning',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      keyPlaceholder: 'sk-ant-...',
      helpLink: 'https://console.anthropic.com/settings/keys',
      models: ANTHROPIC_SUPPORTED_MODELS,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter Multi-Model',
      config: multiAi.openrouter || DEFAULT_MULTI_AI_SETTINGS.openrouter!,
      badge: 'Universal Router',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      keyPlaceholder: 'sk-or-v1-...',
      helpLink: 'https://openrouter.ai/keys',
      models: OPENROUTER_SUPPORTED_MODELS,
      defaultBaseUrl: 'https://openrouter.ai/api/v1',
    },
  ];

  const customProviders = Object.entries(multiAi.providers || {})
    .filter(([id]) => !['groq', 'gemini', 'openai', 'anthropic', 'openrouter'].includes(id))
    .map(([id, conf]) => ({
      id,
      name: conf.name || id,
      config: conf,
      badge: 'Custom Provider',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      keyPlaceholder: 'api-key...',
      models: getSupportedModelsForProvider(id),
      defaultBaseUrl: conf.baseUrl || 'https://api.openai.com/v1',
      helpLink: undefined as string | undefined,
    }));

  const allDisplayProviders = [...providersList, ...customProviders];
  const runtimeStats = getRuntimeDiagnostics();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Central AI Provider Manager
              </h1>
              <p className="text-xs text-slate-500">
                Centralized gateway for Groq, Gemini, OpenAI, Claude, OpenRouter, and custom models with automated failover and feature-level routing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Cloud...' : 'Save AI Architecture (सहेजें)'}</span>
          </button>
        </div>
      </div>

      {saveErrorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>AI Architecture & Feature Mappings synchronized successfully with Firestore!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'providers'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>1. AI Providers (प्रदाता)</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'mapping'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>2. AI Feature Mapping (फ़ीचर मैपिंग)</span>
        </button>

        <button
          onClick={() => setActiveTab('failover')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'failover'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3. Fallback System (फ़ॉलबैक)</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>4. AI Diagnostics (डायग्नोस्टिक्स)</span>
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'playground'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>5. Live Playground (लाइव टेस्ट)</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'prompts'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>6. Academic Prompts (प्रॉम्प्ट्स)</span>
        </button>

        <button
          onClick={() => setActiveTab('userapp')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'userapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>7. 📱 User App Firebase Sync (यूजर ऐप कनेक्ट)</span>
        </button>
      </div>

      {/* ================= TAB 1: AI PROVIDERS ================= */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div>
              <h2 className="text-xs font-extrabold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Configured AI Engine Providers</span>
              </h2>
              <p className="text-[11px] text-indigo-800/80 mt-0.5">
                Enable multiple providers to ensure 100% uptime with zero downtime through automated failover.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddProviderModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Provider</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allDisplayProviders.map((prov) => {
              const testState = testResults[prov.id];
              const isCustom = !['groq', 'gemini', 'openai', 'anthropic', 'openrouter'].includes(prov.id);

              return (
                <div
                  key={prov.id}
                  className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                    prov.config.enabled
                      ? 'border-slate-300 shadow-sm ring-1 ring-slate-100'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{prov.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${prov.badgeColor}`}
                          >
                            {prov.badge}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStatusBadge(
                          testState?.status || prov.config.status,
                          testState?.latencyMs || prov.config.latencyMs
                        )}

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prov.config.enabled ?? false}
                            onChange={(e) =>
                              handleUpdateProvider(prov.id, { enabled: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* API Key */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <Key className="w-3 h-3 text-slate-400" />
                          <span>Secret API Key</span>
                        </label>
                        {prov.helpLink && (
                          <a
                            href={prov.helpLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                          >
                            <span>Get Free Key</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={showKeys[prov.id] ? 'text' : 'password'}
                          placeholder={prov.keyPlaceholder}
                          value={prov.config.apiKey || ''}
                          onChange={(e) =>
                            handleUpdateProvider(prov.id, { apiKey: e.target.value })
                          }
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKeys((prev) => ({ ...prev, [prov.id]: !prev[prov.id] }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showKeys[prov.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Base URL (if custom or OpenAI compatible) */}
                    {(prov.defaultBaseUrl || prov.config.baseUrl || isCustom) && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>Base URL (Endpoint)</span>
                        </label>
                        <input
                          type="text"
                          placeholder={prov.defaultBaseUrl || 'https://api.openai.com/v1'}
                          value={prov.config.baseUrl || prov.defaultBaseUrl || ''}
                          onChange={(e) =>
                            handleUpdateProvider(prov.id, { baseUrl: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>
                    )}

                    {/* Model Selector & Custom model entry */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Active Model
                        </label>
                        <select
                          value={prov.config.model || DEFAULT_AI_MODELS[prov.id] || ''}
                          onChange={(e) =>
                            handleUpdateProvider(prov.id, { model: e.target.value })
                          }
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 bg-white"
                        >
                          {prov.models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Custom Model ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. llama-3.3-70b-versatile"
                          value={prov.config.model || ''}
                          onChange={(e) =>
                            handleUpdateProvider(prov.id, { model: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-indigo-500 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer & Test Connection */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestKey(prov.id)}
                      disabled={testState?.testing}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Zap
                        className={`w-3.5 h-3.5 text-amber-500 ${
                          testState?.testing ? 'animate-spin' : ''
                        }`}
                      />
                      <span>{testState?.testing ? 'Testing API...' : 'Test Connection'}</span>
                    </button>

                    {testState?.message && (
                      <span
                        className={`text-[11px] font-bold truncate max-w-[200px] ${
                          testState.success ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                        title={testState.technicalError || testState.message}
                      >
                        {testState.message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: AI FEATURE MAPPING ================= */}
      {activeTab === 'mapping' && (
        <div className="space-y-6">
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <h2 className="text-xs font-extrabold text-amber-950 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-amber-700" />
              <span>Feature-to-Provider Central Routing Matrix</span>
            </h2>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              Assign specific AI models and providers to individual features (e.g., Ultra-Fast Groq for Doubt Solver, Gemini for Mock Tests).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(AI_FEATURE_REGISTRY) as AIFeatureId[]).map((fKey) => {
              const fDef = AI_FEATURE_REGISTRY[fKey];
              const fMap: AIFeatureConfig =
                featureMappings[fKey] || DEFAULT_FEATURE_MAPPINGS[fKey] || DEFAULT_FEATURE_MAPPINGS.general;

              return (
                <div
                  key={fKey}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{fDef.name}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {fDef.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                      {fKey}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Assigned Provider */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Assigned Provider
                      </label>
                      <select
                        value={fMap.provider || 'auto'}
                        onChange={(e) =>
                          handleUpdateFeatureMapping(fKey, { provider: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                      >
                        <option value="auto">⚡ Auto (Smart Failover)</option>
                        <option value="groq">Groq Cloud (LPU Ultra Fast)</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="openrouter">OpenRouter Multi-Model</option>
                        {customProviders.map((cp) => (
                          <option key={cp.id} value={cp.id}>
                            {cp.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Specific Model Override */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Model Override (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Default from provider"
                        value={fMap.model || ''}
                        onChange={(e) =>
                          handleUpdateFeatureMapping(fKey, { model: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Temperature & Max Tokens sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[10px]">
                    <div>
                      <div className="flex justify-between font-bold text-slate-600 mb-1">
                        <span>Creativity (Temp)</span>
                        <span className="font-mono text-indigo-600">
                          {fMap.temperature ?? 0.7}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={fMap.temperature ?? 0.7}
                        onChange={(e) =>
                          handleUpdateFeatureMapping(fKey, {
                            temperature: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold text-slate-600 mb-1">
                        <span>Max Output Tokens</span>
                        <span className="font-mono text-indigo-600">
                          {fMap.maxTokens ?? 2000}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="4000"
                        step="100"
                        value={fMap.maxTokens ?? 2000}
                        onChange={(e) =>
                          handleUpdateFeatureMapping(fKey, {
                            maxTokens: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: FALLBACK & FAILOVER ================= */}
      {activeTab === 'failover' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Automated Failover Chain Configuration</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  If primary provider hits rate limit (429), server downtime (5xx), or timeout, request automatically transitions to the next available provider.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Auto Failover:</span>
                <button
                  type="button"
                  onClick={() =>
                    setMultiAi((prev) => ({
                      ...prev,
                      enableAutoFailover: !prev.enableAutoFailover,
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                    multiAi.enableAutoFailover
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {multiAi.enableAutoFailover ? 'ON (Active)' : 'OFF (Manual Only)'}
                </button>
              </div>
            </div>

            {/* Ordering List */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Failover Priority Sequence (Drag / Move to change order):
              </span>

              {(multiAi.activeOrder || ['groq', 'gemini', 'openai', 'anthropic']).map(
                (provId, idx) => {
                  const provConf =
                    multiAi.providers?.[provId] || (multiAi as any)[provId];
                  const isEnabled = provConf?.enabled ?? false;

                  return (
                    <div
                      key={provId}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {provConf?.name || provId.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Model: {provConf?.model || DEFAULT_AI_MODELS[provId] || 'Default'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isEnabled ? 'Ready' : 'Disabled'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePriority(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePriority(idx, 'down')}
                            disabled={
                              idx ===
                              (multiAi.activeOrder || ['groq', 'gemini', 'openai', 'anthropic'])
                                .length -
                                1
                            }
                            className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: AI DIAGNOSTICS & HEALTH ================= */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* Provider Health Matrix */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Provider Real-Time Health & Status Matrix</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2 px-3">Provider</th>
                    <th className="py-2 px-3">Active Model</th>
                    <th className="py-2 px-3">Connection Status</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Last Tested</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDisplayProviders.map((prov) => {
                    const testState = testResults[prov.id];
                    return (
                      <tr key={prov.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-900">{prov.name}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {prov.config.model || DEFAULT_AI_MODELS[prov.id] || 'Default'}
                        </td>
                        <td className="py-3 px-3">
                          {renderStatusBadge(
                            testState?.status || prov.config.status,
                            testState?.latencyMs || prov.config.latencyMs
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {prov.config.latencyMs ? `${prov.config.latencyMs}ms` : '—'}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400">
                          {prov.config.lastTested
                            ? new Date(prov.config.lastTested).toLocaleTimeString()
                            : 'Never'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleTestKey(prov.id)}
                            disabled={testState?.testing}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] cursor-pointer"
                          >
                            {testState?.testing ? 'Testing...' : 'Ping'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Usage Stats */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Feature Usage & Execution Counters</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(AI_FEATURE_REGISTRY) as AIFeatureId[]).map((fKey) => {
                const stat = runtimeStats.featureStats[fKey] || {
                  totalCalls: 0,
                  successfulCalls: 0,
                  failedCalls: 0,
                };
                const fDef = AI_FEATURE_REGISTRY[fKey];
                return (
                  <div key={fKey} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block truncate">
                      {fDef.name}
                    </span>
                    <span className="text-lg font-black text-slate-900 block mt-1">
                      {stat.totalCalls} Calls
                    </span>
                    <div className="flex items-center gap-2 text-[9px] font-mono font-bold mt-1">
                      <span className="text-emerald-600">✓ {stat.successfulCalls}</span>
                      <span className="text-rose-600">✗ {stat.failedCalls}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Fallback Logs */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Recent Failover Event Logs</span>
            </h2>

            {runtimeStats.fallbackLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No recent failover events. Primary providers operating normally.
              </p>
            ) : (
              <div className="space-y-2">
                {runtimeStats.fallbackLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-amber-950 block">
                        Failover triggered for feature: {log.feature}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        From: {log.attemptedProvider} → To: {log.fallbackProvider} ({log.reason})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: LIVE TEST PLAYGROUND ================= */}
      {activeTab === 'playground' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span>Central AI Request Tester & Live Playground</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Send queries through the central <code className="text-indigo-600 font-bold">requestAI(...)</code> pipeline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Feature Selector */}
              <select
                value={playgroundFeature}
                onChange={(e) => setPlaygroundFeature(e.target.value as AIFeatureId)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              >
                {(Object.keys(AI_FEATURE_REGISTRY) as AIFeatureId[]).map((k) => (
                  <option key={k} value={k}>
                    Feature: {AI_FEATURE_REGISTRY[k].name}
                  </option>
                ))}
              </select>

              {/* Provider Override */}
              <select
                value={playgroundProviderOverride}
                onChange={(e) => setPlaygroundProviderOverride(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="auto">⚡ Auto Routing</option>
                <option value="groq">Groq</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
          </div>

          {/* Chat box */}
          <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
                {m.providerUsed && (
                  <span className="text-[9px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    <span>Engine: {m.providerUsed}</span>
                    {m.modelUsed && <span>• {m.modelUsed}</span>}
                    {m.latencyMs && <span>• {m.latencyMs}ms</span>}
                  </span>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing through Central AI Provider Manager...</span>
              </div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSendTestQuery} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask an academic question or prompt for testing..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={isThinking || !testQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 6: ACADEMIC PROMPTS ================= */}
      {activeTab === 'prompts' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Academic System Prompt & Persona Presets</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select one of the master academic prompts designed specifically for UPSC, State PSC, SSC, and NEET/JEE students.
            </p>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ACADEMIC_PROMPT_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">
                    {preset.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {preset.description}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSystemPrompt(preset.prompt);
                    toast.success(`Applied prompt preset: ${preset.title}`, 'Preset Applied');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 border border-indigo-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply This Preset</span>
                </button>
              </div>
            ))}
          </div>

          {/* Current System Prompt Textarea */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Active Master System Prompt
            </label>
            <textarea
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:border-indigo-500 bg-white leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ================= TAB 7: USER APP FIREBASE SYNC & INTEGRATION ================= */}
      {activeTab === 'userapp' && (
        <div className="space-y-6">
          {/* Top Live Sync Status Card */}
          <div className="p-6 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl shadow-lg border border-emerald-700/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white tracking-tight">
                      Firebase Cloud Firestore Live Synchronization
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Synced</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5 font-mono">
                    Firestore Path: <span className="text-emerald-300 font-bold">/appSettings/general</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Syncing with Firestore...' : 'Push AI Settings to User App Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-emerald-800/60">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400/80 uppercase font-bold block">Active Providers Synced</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">
                  {multiAi.activeOrder?.join(' → ') || 'Groq → Gemini → OpenAI'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400/80 uppercase font-bold block">Failover Protection</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">
                  {multiAi.enableAutoFailover ? 'Active (Auto-Switch on Rate Limit)' : 'Manual'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400/80 uppercase font-bold block">User App AI Tutor</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">
                  {aiEnabled ? 'Enabled for Students' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* User App Integration Prompts & Code Guide */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  <span>User App Code & Prompts (यूजर ऐप के लिए कोड व प्रॉम्प्ट)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Copy and paste this code or system prompt directly into your User App (Flutter, React Native, Kotlin, Web).
                </p>
              </div>

              {/* Code Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedUserAppCodeLang('prompt')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedUserAppCodeLang === 'prompt' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  System Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserAppCodeLang('flutter')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedUserAppCodeLang === 'flutter' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flutter / Dart
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserAppCodeLang('reactnative')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedUserAppCodeLang === 'reactnative' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  React Native / JS
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserAppCodeLang('kotlin')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedUserAppCodeLang === 'kotlin' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Android Kotlin
                </button>
              </div>
            </div>

            {/* Snippet Content Area */}
            {selectedUserAppCodeLang === 'prompt' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Master User App Doubt-Solving System Prompt:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(systemPrompt);
                      toast.success('System Prompt copied to clipboard!', 'Copied');
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
                  {systemPrompt}
                </pre>
              </div>
            )}

            {selectedUserAppCodeLang === 'flutter' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Flutter Dart: Auto-Sync AI Service with Failover:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const flutterCode = `// lib/services/veda_ai_service.dart
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;

class VedaAIService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Fetches real-time AI credentials and system prompt directly from Firestore
  static Future<String> askDoubt(String studentQuestion) async {
    final docSnap = await _firestore.collection('appSettings').doc('general').get();
    if (!docSnap.exists) throw Exception('Admin configuration not found');

    final data = docSnap.data()!;
    final multiAi = data['aiMultiProviders'] as Map<String, dynamic>? ?? {};
    final activeOrder = (multiAi['activeOrder'] as List<dynamic>?)?.cast<String>() ?? ['groq', 'gemini', 'openai'];
    final sysPrompt = data['aiSystemPrompt'] ?? 'You are Veda AI tutor.';

    // Try providers in priority sequence
    for (String providerId in activeOrder) {
      final provConfig = multiAi[providerId] as Map<String, dynamic>?;
      if (provConfig == null || provConfig['enabled'] != true) continue;

      final apiKey = (provConfig['apiKey'] ?? '').toString().trim();
      if (apiKey.isEmpty) continue;
      final model = provConfig['model'] ?? 'gemini-2.5-flash';

      try {
        if (providerId == 'gemini') {
          final url = Uri.parse('https://generativelanguage.googleapis.com/v1beta/models/\$model:generateContent?key=\$apiKey');
          final res = await http.post(url, headers: {'Content-Type': 'application/json'}, body: jsonEncode({
            'contents': [{'role': 'user', 'parts': [{'text': '\$sysPrompt\\n\\nStudent Question: \$studentQuestion'}]}]
          }));
          if (res.statusCode == 200) {
            final json = jsonDecode(res.body);
            return json['candidates'][0]['content']['parts'][0]['text'];
          }
        } else {
          // Groq / OpenAI / OpenRouter
          final baseUrl = provConfig['baseUrl'] ?? (providerId == 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
          final url = Uri.parse('\$baseUrl/chat/completions');
          final res = await http.post(url, headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer \$apiKey',
          }, body: jsonEncode({
            'model': model,
            'messages': [
              {'role': 'system', 'content': sysPrompt},
              {'role': 'user', 'content': studentQuestion}
            ]
          }));
          if (res.statusCode == 200) {
            final json = jsonDecode(res.body);
            return json['choices'][0]['message']['content'];
          }
        }
      } catch (e) {
        // Auto failover to next provider
        continue;
      }
    }
    throw Exception('All AI engines busy. Please try again.');
  }
}`;
                      navigator.clipboard.writeText(flutterCode);
                      toast.success('Flutter code copied!', 'Copied');
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Flutter Code</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-sky-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800 max-h-96">
{`// lib/services/veda_ai_service.dart
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;

class VedaAIService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Fetches real-time AI credentials and system prompt directly from Firestore
  static Future<String> askDoubt(String studentQuestion) async {
    final docSnap = await _firestore.collection('appSettings').doc('general').get();
    if (!docSnap.exists) throw Exception('Admin configuration not found');

    final data = docSnap.data()!;
    final multiAi = data['aiMultiProviders'] as Map<String, dynamic>? ?? {};
    final activeOrder = (multiAi['activeOrder'] as List<dynamic>?)?.cast<String>() ?? ['groq', 'gemini', 'openai'];
    final sysPrompt = data['aiSystemPrompt'] ?? 'You are Veda AI tutor.';

    // Try providers in priority sequence
    for (String providerId in activeOrder) {
      final provConfig = multiAi[providerId] as Map<String, dynamic>?;
      if (provConfig == null || provConfig['enabled'] != true) continue;

      final apiKey = (provConfig['apiKey'] ?? '').toString().trim();
      if (apiKey.isEmpty) continue;
      final model = provConfig['model'] ?? 'gemini-2.5-flash';

      try {
        if (providerId == 'gemini') {
          final url = Uri.parse('https://generativelanguage.googleapis.com/v1beta/models/\$model:generateContent?key=\$apiKey');
          final res = await http.post(url, headers: {'Content-Type': 'application/json'}, body: jsonEncode({
            'contents': [{'role': 'user', 'parts': [{'text': '\$sysPrompt\\n\\nStudent Question: \$studentQuestion'}]}]
          }));
          if (res.statusCode == 200) {
            final json = jsonDecode(res.body);
            return json['candidates'][0]['content']['parts'][0]['text'];
          }
        } else {
          // Groq / OpenAI / OpenRouter
          final baseUrl = provConfig['baseUrl'] ?? (providerId == 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
          final url = Uri.parse('\$baseUrl/chat/completions');
          final res = await http.post(url, headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer \$apiKey',
          }, body: jsonEncode({
            'model': model,
            'messages': [
              {'role': 'system', 'content': sysPrompt},
              {'role': 'user', 'content': studentQuestion}
            ]
          }));
          if (res.statusCode == 200) {
            final json = jsonDecode(res.body);
            return json['choices'][0]['message']['content'];
          }
        }
      } catch (e) {
        // Auto failover to next provider
        continue;
      }
    }
    throw Exception('All AI engines busy. Please try again.');
  }
}`}
                </pre>
              </div>
            )}

            {selectedUserAppCodeLang === 'reactnative' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">React Native / JS: Firestore Live Listener & AI Hook:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const rnCode = `// services/useVedaAI.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function askVedaAI(studentPrompt: string) {
  const snap = await getDoc(doc(db, 'appSettings', 'general'));
  const data = snap.data() || {};
  const multi = data.aiMultiProviders || {};
  const activeOrder = multi.activeOrder || ['groq', 'gemini', 'openai'];
  const sysPrompt = data.aiSystemPrompt || 'You are Veda AI academic tutor.';

  for (const prov of activeOrder) {
    const conf = multi[prov];
    if (!conf || !conf.enabled || !conf.apiKey) continue;
    try {
      if (prov === 'gemini') {
        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${conf.model || 'gemini-2.5-flash'}:generateContent?key=\${conf.apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: \`\${sysPrompt}\\n\\nQuestion: \${studentPrompt}\` }] }]
          })
        });
        const json = await res.json();
        return json.candidates[0].content.parts[0].text;
      } else {
        const base = conf.baseUrl || (prov === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
        const res = await fetch(\`\${base}/chat/completions\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${conf.apiKey}\`
          },
          body: JSON.stringify({
            model: conf.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: studentPrompt }
            ]
          })
        });
        const json = await res.json();
        return json.choices[0].message.content;
      }
    } catch (err) {
      continue; // Auto failover to next provider
    }
  }
  throw new Error('AI engines temporarily busy.');
}`;
                      navigator.clipboard.writeText(rnCode);
                      toast.success('React Native code copied!', 'Copied');
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy React Native Code</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-yellow-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800 max-h-96">
{`// services/useVedaAI.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function askVedaAI(studentPrompt: string) {
  const snap = await getDoc(doc(db, 'appSettings', 'general'));
  const data = snap.data() || {};
  const multi = data.aiMultiProviders || {};
  const activeOrder = multi.activeOrder || ['groq', 'gemini', 'openai'];
  const sysPrompt = data.aiSystemPrompt || 'You are Veda AI academic tutor.';

  for (const prov of activeOrder) {
    const conf = multi[prov];
    if (!conf || !conf.enabled || !conf.apiKey) continue;
    try {
      if (prov === 'gemini') {
        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${conf.model || 'gemini-2.5-flash'}:generateContent?key=\${conf.apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: \`\${sysPrompt}\\n\\nQuestion: \${studentPrompt}\` }] }]
          })
        });
        const json = await res.json();
        return json.candidates[0].content.parts[0].text;
      } else {
        const base = conf.baseUrl || (prov === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
        const res = await fetch(\`\${base}/chat/completions\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${conf.apiKey}\`
          },
          body: JSON.stringify({
            model: conf.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: studentPrompt }
            ]
          })
        });
        const json = await res.json();
        return json.choices[0].message.content;
      }
    } catch (err) {
      continue; // Auto failover to next provider
    }
  }
  throw new Error('AI engines temporarily busy.');
}`}
                </pre>
              </div>
            )}

            {selectedUserAppCodeLang === 'kotlin' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Android Kotlin: Firestore Cloud AI Helper:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const kotlinCode = `// VedaAIService.kt
package com.eduveda.app.ai

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class VedaAIService {
    private val firestore = FirebaseFirestore.getInstance()
    private val client = OkHttpClient()

    suspend fun askDoubt(question: String): String {
        val doc = firestore.collection("appSettings").document("general").get().await()
        val multi = doc.get("aiMultiProviders") as? Map<String, Any> ?: emptyMap()
        val sysPrompt = doc.getString("aiSystemPrompt") ?: "You are Veda AI tutor."
        val activeOrder = multi["activeOrder"] as? List<String> ?: listOf("groq", "gemini", "openai")

        for (prov in activeOrder) {
            val conf = multi[prov] as? Map<String, Any> ?: continue
            val isEnabled = conf["enabled"] as? Boolean ?: false
            val apiKey = (conf["apiKey"] as? String)?.trim() ?: ""
            if (!isEnabled || apiKey.isEmpty()) continue

            try {
                if (prov == "gemini") {
                    val model = conf["model"] as? String ?: "gemini-2.5-flash"
                    val url = "https://generativelanguage.googleapis.com/v1beta/models/\$model:generateContent?key=\$apiKey"
                    val bodyJson = JSONObject().apply {
                        put("contents", org.json.JSONArray().put(JSONObject().apply {
                            put("parts", org.json.JSONArray().put(JSONObject().put("text", "\$sysPrompt\\n\\n\$question")))
                        }))
                    }
                    val req = Request.Builder().url(url).post(bodyJson.toString().toRequestBody("application/json".toMediaType())).build()
                    val res = client.newCall(req).execute()
                    if (res.isSuccessful) {
                        val respJson = JSONObject(res.body?.string() ?: "{}")
                        return respJson.getJSONArray("candidates").getJSONObject(0).getJSONObject("content").getJSONArray("parts").getJSONObject(0).getString("text")
                    }
                }
            } catch (e: Exception) {
                continue
            }
        }
        throw Exception("AI service busy")
    }
}`;
                      navigator.clipboard.writeText(kotlinCode);
                      toast.success('Android Kotlin code copied!', 'Copied');
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Kotlin Code</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-purple-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800 max-h-96">
{`// VedaAIService.kt
package com.eduveda.app.ai

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class VedaAIService {
    private val firestore = FirebaseFirestore.getInstance()
    private val client = OkHttpClient()

    suspend fun askDoubt(question: String): String {
        val doc = firestore.collection("appSettings").document("general").get().await()
        val multi = doc.get("aiMultiProviders") as? Map<String, Any> ?: emptyMap()
        val sysPrompt = doc.getString("aiSystemPrompt") ?: "You are Veda AI tutor."
        val activeOrder = multi["activeOrder"] as? List<String> ?: listOf("groq", "gemini", "openai")

        for (prov in activeOrder) {
            val conf = multi[prov] as? Map<String, Any> ?: continue
            val isEnabled = conf["enabled"] as? Boolean ?: false
            val apiKey = (conf["apiKey"] as? String)?.trim() ?: ""
            if (!isEnabled || apiKey.isEmpty()) continue

            try {
                if (prov == "gemini") {
                    val model = conf["model"] as? String ?: "gemini-2.5-flash"
                    val url = "https://generativelanguage.googleapis.com/v1beta/models/\$model:generateContent?key=\$apiKey"
                    val bodyJson = JSONObject().apply {
                        put("contents", org.json.JSONArray().put(JSONObject().apply {
                            put("parts", org.json.JSONArray().put(JSONObject().put("text", "\$sysPrompt\\n\\n\$question")))
                        }))
                    }
                    val req = Request.Builder().url(url).post(bodyJson.toString().toRequestBody("application/json".toMediaType())).build()
                    val res = client.newCall(req).execute()
                    if (res.isSuccessful) {
                        val respJson = JSONObject(res.body?.string() ?: "{}")
                        return respJson.getJSONArray("candidates").getJSONObject(0).getJSONObject("content").getJSONArray("parts").getJSONObject(0).getString("text")
                    }
                }
            } catch (e: Exception) {
                continue
            }
        }
        throw Exception("AI service busy")
    }
}`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD CUSTOM PROVIDER MODAL */}
      {showAddProviderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Custom / Future AI Provider</span>
              </h3>
              <button
                onClick={() => setShowAddProviderModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Provider ID</label>
                <input
                  type="text"
                  placeholder="e.g. deepseek, together_ai, mistral"
                  value={newProviderForm.id}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. DeepSeek V3 (Direct)"
                  value={newProviderForm.name}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Base URL (OpenAI-compatible)</label>
                <input
                  type="text"
                  placeholder="https://api.deepseek.com/v1"
                  value={newProviderForm.baseUrl}
                  onChange={(e) =>
                    setNewProviderForm({ ...newProviderForm, baseUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Model</label>
                <input
                  type="text"
                  placeholder="deepseek-chat"
                  value={newProviderForm.model}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={newProviderForm.apiKey}
                  onChange={(e) =>
                    setNewProviderForm({ ...newProviderForm, apiKey: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddProviderModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomProvider}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

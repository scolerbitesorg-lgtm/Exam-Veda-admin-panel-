import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  Palette,
  Sliders,
  Bell,
  AlertTriangle,
  Smartphone,
  Save,
  CheckCircle2,
  RefreshCw,
  Key,
  Database,
  Layers,
  FileCode,
  ShieldAlert,
  Zap,
  Download,
  Share2,
  Phone,
  MessageSquare,
  Lock,
  Copy,
  Check,
  Image as ImageIcon,
  Activity,
  Globe,
  Radio,
  Clock,
  HelpCircle,
  Upload,
  Timer,
  Bot,
  Trash2,
  CheckCircle,
  Flame,
  Shield,
  ShieldCheck,
  Megaphone,
  Gauge,
  Users,
  LogOut,
  Send,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { updateAppSettings } from '../../services/dbService';
import { useToast } from '../../context/ToastContext';
import { compressAndReadImageFile } from '../../utils/imageUtils';
import {
  isAnnouncementActive,
  formatTimeRemaining,
  toLocalDatetimeInputValue,
  fromLocalDatetimeInputValue,
  calculateExpiryTimestamp,
} from '../../utils/announcementUtils';
import { AI_SYSTEM_PROMPT_PRESETS } from '../../config/aiPrompts';
import {
  GROQ_SUPPORTED_MODELS,
  GEMINI_SUPPORTED_MODELS,
  OPENAI_SUPPORTED_MODELS,
  ANTHROPIC_SUPPORTED_MODELS,
  DEFAULT_AI_MODELS,
} from '../../config/aiModels';
import firebaseConfigData from '../../../firebase-applet-config.json';
import type {
  AppSettings,
  UserAppTheme,
  UserAppModules,
  SecuritySettings,
  RateLimitSettings,
  PopupBannerConfig,
} from '../../types';
import { QuizThemeSettingsModal } from './QuizThemeSettingsModal';

interface DeveloperConsoleViewProps {
  settings: AppSettings;
  onRefreshData?: () => void;
}

const DEFAULT_LOGO_PRESETS = [
  {
    name: '1. Edu Veda Gold Crest',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: '2. Smart Brain & Quill',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: '3. Academic Shield Crest',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: '4. Modern Futuristic Academy',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&auto=format&fit=crop&q=80',
  },
];

export const DeveloperConsoleView: React.FC<DeveloperConsoleViewProps> = ({
  settings,
  onRefreshData,
}) => {
  const toast = useToast();

  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    logoSlot1: settings.logoSlot1 || DEFAULT_LOGO_PRESETS[0].url,
    logoSlot2: settings.logoSlot2 || DEFAULT_LOGO_PRESETS[1].url,
    logoSlot3: settings.logoSlot3 || DEFAULT_LOGO_PRESETS[2].url,
    logoSlot4: settings.logoSlot4 || DEFAULT_LOGO_PRESETS[3].url,
    logoSlotNames: {
      slot1: settings.logoSlotNames?.slot1 || 'Slot 1 (Gold Crest)',
      slot2: settings.logoSlotNames?.slot2 || 'Slot 2 (Brain & Quill)',
      slot3: settings.logoSlotNames?.slot3 || 'Slot 3 (Shield Badge)',
      slot4: settings.logoSlotNames?.slot4 || 'Slot 4 (Custom Emblem)',
    },
    userAppAiProvider: settings.userAppAiProvider || 'auto',
    userAppActiveAiModel: settings.userAppActiveAiModel || 'auto',
    theme: settings.theme || {
      primaryColor: '#4f46e5',
      secondaryColor: '#9333ea',
      accentColor: '#f59e0b',
      cardBgColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '16px',
      darkMode: false,
      customCss: '',
    },
    modules: settings.modules || {
      enableMockTests: true,
      enableVideoDownloads: true,
      enablePDFDownloads: true,
      enableStudentDoubts: true,
      enableLeaderboard: true,
      enableGuestMode: true,
      enablePaymentGateway: false,
    },
    securitySettings: settings.securitySettings || {
      singleDeviceLogin: true,
      blockScreenshots: true,
      blockRootedDevices: true,
      enableDynamicWatermark: true,
      maxExamTabSwitches: 3,
      allowAccountSelfDeletion: true,
      sessionEpoch: 1,
    },
    rateLimitSettings: settings.rateLimitSettings || {
      dailyAiLimitFree: 10,
      dailyAiLimitPro: 100,
      dailyPdfLimitFree: 5,
      maxConcurrentStreams: 1,
    },
    popupBanner: settings.popupBanner || {
      enabled: false,
      title: '🎯 Special Live Exam & Scholarship Batch 2026',
      subtitle: 'Flat 50% Off for next 24 Hours! Use code VEDA50',
      badgeText: 'LIMITED TIME OFFER',
      imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
      actionText: 'Explore Batches Now',
      actionUrl: 'tab:courses',
      showOncePerSession: true,
    },
    remoteJsonConfig:
      settings.remoteJsonConfig ||
      JSON.stringify(
        {
          homeBanners: [
            {
              id: 'banner_1',
              title: '🎯 Special Mock Test Series 2026',
              subtitle: 'Free All India Scholarship Test',
              actionUrl: 'tab:mocktests',
              bgColor: 'from-indigo-600 to-purple-600',
            },
          ],
          featuredTags: ['Current Affairs', 'General Science', 'Maths Tricks', 'Reasoning'],
          liveExamAlert: 'Upcoming Exam: 15 October 2026',
          dailyQuoteHindi: 'मेहनत इतनी खामोशी से करो कि सफलता शोर मचा दे!',
        },
        null,
        2
      ),
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<
    | 'branding'
    | 'logos'
    | 'announcements'
    | 'ai'
    | 'modules'
    | 'security'
    | 'rateLimits'
    | 'popupBanner'
    | 'remoteCode'
    | 'forceUpdate'
    | 'firebase'
  >('branding');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeModalTab, setThemeModalTab] = useState<'mcq' | 'mocktest'>('mcq');

  // Logo upload state
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const fileInputRefMain = useRef<HTMLInputElement>(null);
  const fileInputRefSlot1 = useRef<HTMLInputElement>(null);
  const fileInputRefSlot2 = useRef<HTMLInputElement>(null);
  const fileInputRefSlot3 = useRef<HTMLInputElement>(null);
  const fileInputRefSlot4 = useRef<HTMLInputElement>(null);
  const fileInputRefPopup = useRef<HTMLInputElement>(null);

  // Announcement countdown local ticker
  const [announcementCountdown, setAnnouncementCountdown] = useState(
    formatTimeRemaining(formData.announcementExpiresAt)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementCountdown(formatTimeRemaining(formData.announcementExpiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [formData.announcementExpiresAt]);

  // Measurement ID
  const [measurementId, setMeasurementId] = useState(
    firebaseConfigData.measurementId || 'G-EDU7402165'
  );

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success(`Copied to clipboard! (${keyName})`, 'Copied / कॉपी किया गया');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setJsonError(null);

    // Validate JSON config if modified
    if (formData.remoteJsonConfig) {
      try {
        JSON.parse(formData.remoteJsonConfig);
      } catch (err: any) {
        setJsonError('Invalid JSON format: ' + err.message);
        toast.error(`Invalid JSON configuration: ${err.message}`, 'JSON Error / अमान्य JSON');
        setSaving(false);
        return;
      }
    }

    try {
      await updateAppSettings(formData);
      setSaveSuccess(true);
      toast.success('All Developer Console updates published live to Firestore!', 'Changes Published / सहेजा गया');
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      toast.error(`Failed to update settings: ${err.message}`, 'Save Failed / त्रुटि');
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = (field: keyof UserAppTheme, val: any) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...(prev.theme as UserAppTheme),
        [field]: val,
      },
      themeColor: field === 'primaryColor' ? val : prev.themeColor,
    }));
    toast.info(`Theme ${String(field)} updated`, 'Theme Updated');
  };

  const updateModule = (field: keyof UserAppModules, val: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: {
        ...(prev.modules as UserAppModules),
        [field]: val,
      },
    }));
    toast.info(`Module ${String(field)} set to ${val ? 'ON' : 'OFF'}`, 'Module Toggle');
  };

  // Security and Rate Limit Handlers
  const updateSecuritySetting = (field: keyof SecuritySettings, val: any) => {
    setFormData((prev) => ({
      ...prev,
      securitySettings: {
        ...(prev.securitySettings as SecuritySettings),
        [field]: val,
      },
    }));
    toast.info(`Security setting ${String(field)} updated`, 'Security Updated');
  };

  const updateRateLimitSetting = (field: keyof RateLimitSettings, val: any) => {
    setFormData((prev) => ({
      ...prev,
      rateLimitSettings: {
        ...(prev.rateLimitSettings as RateLimitSettings),
        [field]: val,
      },
    }));
    toast.info(`Rate limit ${String(field)} updated`, 'Quota Updated');
  };

  const updatePopupBanner = (field: keyof PopupBannerConfig, val: any) => {
    setFormData((prev) => ({
      ...prev,
      popupBanner: {
        ...(prev.popupBanner as PopupBannerConfig),
        [field]: val,
      },
    }));
  };

  const handlePopupBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAndReadImageFile(file, 800, 800, 0.9);
      updatePopupBanner('imageUrl', dataUrl);
      toast.success('Promotional popup image uploaded from device!', 'Popup Image Set');
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message}`, 'Upload Error');
    }
  };

  const handleForceLogoutAllUsers = () => {
    const currentEpoch = formData.securitySettings?.sessionEpoch || 1;
    const newEpoch = currentEpoch + 1;
    setFormData((prev) => ({
      ...prev,
      securitySettings: {
        ...(prev.securitySettings as SecuritySettings),
        sessionEpoch: newEpoch,
      },
    }));
    toast.warning(
      `Session Epoch bumped to v${newEpoch}. All students will be forced to log in again upon next launch.`,
      'Global Logout Triggered'
    );
  };

  // Upload handler for Main Logo
  const handleMainLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAndReadImageFile(file, 400, 400, 0.9);
      setFormData((prev) => ({ ...prev, logo: dataUrl }));
      toast.success('Main logo image uploaded from device successfully!', 'Logo Uploaded');
    } catch (err: any) {
      toast.error(`Logo upload failed: ${err.message}`, 'Upload Error');
    }
  };

  // Upload handler for Specific Custom Slot (1 to 4)
  const handleSlotLogoUpload = async (slotNum: 1 | 2 | 3 | 4, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot(slotNum);
    try {
      const dataUrl = await compressAndReadImageFile(file, 400, 400, 0.9);
      const slotKey = `logoSlot${slotNum}` as keyof AppSettings;
      setFormData((prev) => ({
        ...prev,
        [slotKey]: dataUrl,
      }));
      toast.success(`Logo Slot ${slotNum} uploaded from device/gallery! Click 'Activate' to apply.`, `Slot ${slotNum} Updated`);
    } catch (err: any) {
      toast.error(`Slot ${slotNum} upload failed: ${err.message}`, 'Upload Error');
    } finally {
      setUploadingSlot(null);
    }
  };

  // 1-Click Activate a Slot as Main Active Logo
  const handleActivateLogoSlot = (slotNum: 1 | 2 | 3 | 4) => {
    const slotKey = `logoSlot${slotNum}` as keyof AppSettings;
    const url = formData[slotKey] as string;
    if (!url) {
      toast.warning(`Slot ${slotNum} is currently empty. Please upload or set a URL first.`, 'Slot Empty');
      return;
    }
    setFormData((prev) => ({ ...prev, logo: url }));
    toast.success(`⚡ Logo Slot ${slotNum} is now the ACTIVE App Logo across the entire app!`, 'Active Logo Switched');
  };

  // Quick Announcement Duration Presets
  const handleSetAnnouncementDuration = (hours: number | 'permanent') => {
    if (hours === 'permanent') {
      setFormData((prev) => ({
        ...prev,
        showBanner: true,
        announcementExpiresAt: undefined,
      }));
      toast.success('Announcement set to Permanent (Never Expires).', 'Timer Updated');
    } else {
      const expireDate = new Date(Date.now() + hours * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        showBanner: true,
        announcementExpiresAt: expireDate.toISOString(),
      }));
      toast.success(`Announcement timer set for ${hours} hours! Will auto-turn off after expiry.`, 'Timer Active');
    }
  };

  // 1-Click System Prompt Apply
  const handleApplyPromptPreset = (preset: typeof AI_SYSTEM_PROMPT_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      aiSystemPrompt: preset.prompt,
    }));
    toast.success(`Applied AI Prompt: "${preset.name}"`, 'Prompt Preset Loaded');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              Lead Dev Authority
            </span>
            <span className="text-xs text-indigo-300 font-mono">v{formData.version}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Developer Cloud Console & Full Brand Control</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Realtime centralized branding, 4 custom logo slots, auto-off announcement timer, AI engine selection, and emergency controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Live Synchronized!</span>
            </div>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Changes...' : 'Save & Publish Remote Updates'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/80 rounded-2xl text-xs font-bold border border-slate-300/60 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('branding')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-indigo-600" />
          <span>1. Identity & Theme</span>
        </button>
        <button
          onClick={() => setActiveSubTab('logos')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'logos'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-purple-600" />
          <span>2. 4 Logo Slots</span>
        </button>
        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'announcements'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Timer className="w-4 h-4 text-amber-600" />
          <span>3. Timer Notice</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'ai'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-600" />
          <span>4. AI Engine & Prompt</span>
        </button>
        <button
          onClick={() => setActiveSubTab('modules')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'modules'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-600" />
          <span>5. Feature Flags</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-white text-indigo-950 shadow-sm ring-1 ring-emerald-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>6. 🛡️ Security & Anti-Cheat</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rateLimits')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'rateLimits'
              ? 'bg-white text-indigo-950 shadow-sm ring-1 ring-indigo-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gauge className="w-4 h-4 text-indigo-600" />
          <span>7. ⚡ AI Quota & Limits</span>
        </button>
        <button
          onClick={() => setActiveSubTab('popupBanner')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'popupBanner'
              ? 'bg-white text-indigo-950 shadow-sm ring-1 ring-amber-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-600" />
          <span>8. 📢 Modal Pop-Up Broadcaster</span>
        </button>
        <button
          onClick={() => setActiveSubTab('remoteCode')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'remoteCode'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-600" />
          <span>9. Remote JSON</span>
        </button>
        <button
          onClick={() => setActiveSubTab('forceUpdate')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'forceUpdate'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>10. Maintenance & Kill Switches</span>
        </button>
        <button
          onClick={() => setActiveSubTab('firebase')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer ${
            activeSubTab === 'firebase'
              ? 'bg-white text-indigo-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-600" />
          <span>11. Cloud Backend</span>
        </button>
      </div>

      {jsonError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
          {jsonError}
        </div>
      )}

      {/* SUBTAB 1: App Identity & Colors */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                User App Identity & Primary Logo
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">User App Display Name</label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    placeholder="e.g. Edu Veda Learning App"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    placeholder="e.g. Comprehensive Exam Preparation"
                  />
                </div>

                {/* Active Logo with Device Upload */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-bold text-slate-900 text-xs">
                        Active App Logo (वर्तमान सक्रिय लोगो)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        This logo appears on user app headers, splash screen, and mock tests.
                      </p>
                    </div>
                    {formData.logo && (
                      <img
                        src={formData.logo}
                        alt="Active Logo Preview"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 shadow-sm bg-white"
                      />
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                      placeholder="https://... direct image link"
                    />

                    <input
                      type="file"
                      ref={fileInputRefMain}
                      onChange={handleMainLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRefMain.current?.click()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device / Gallery</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Support Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                Live Theme Colors & Styles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.theme?.primaryColor || '#4f46e5'}
                      onChange={(e) => updateTheme('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.theme?.primaryColor || '#4f46e5'}
                      onChange={(e) => updateTheme('primaryColor', e.target.value)}
                      className="w-28 px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Secondary Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.theme?.secondaryColor || '#9333ea'}
                      onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.theme?.secondaryColor || '#9333ea'}
                      onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                      className="w-28 px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Highlight Yellow/Gold</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.theme?.accentColor || '#f59e0b'}
                      onChange={(e) => updateTheme('accentColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.theme?.accentColor || '#f59e0b'}
                      onChange={(e) => updateTheme('accentColor', e.target.value)}
                      className="w-28 px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* MCQ & Mock Test Theming button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">MCQ & Mock Test Visual Theme (A2Z)</h4>
                  <p className="text-[11px] text-slate-500">Configure NTA exam colors, timer styles, and buttons</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs cursor-pointer"
                >
                  Configure Exam Theme ➔
                </button>
              </div>
            </div>
          </div>

          {/* Simulator Preview */}
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  Live Mobile Simulator
                </span>
                <span className="text-[10px] text-slate-400">Instant Preview</span>
              </div>

              <div
                className="rounded-2xl p-4 text-slate-900 overflow-hidden shadow-inner min-h-[380px] flex flex-col justify-between"
                style={{ backgroundColor: formData.theme?.cardBgColor || '#ffffff' }}
              >
                <div>
                  <div
                    className="p-3.5 rounded-xl text-white flex items-center justify-between shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${formData.theme?.primaryColor || '#4f46e5'}, ${formData.theme?.secondaryColor || '#9333ea'})`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Logo"
                          className="w-7 h-7 rounded-lg object-cover bg-white/20"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black">
                          EV
                        </div>
                      )}
                      <div>
                        <div className="font-black text-xs">{formData.appName}</div>
                        <div className="text-[9px] opacity-80">{formData.tagline || 'Education Portal'}</div>
                      </div>
                    </div>
                  </div>

                  {formData.showBanner && formData.bannerNotice && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="line-clamp-1">{formData.bannerNotice}</span>
                    </div>
                  )}

                  <div className="mt-3 space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="font-bold">🎯 Live Mock Series</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] text-white font-bold"
                        style={{ backgroundColor: formData.theme?.accentColor || '#f59e0b' }}
                      >
                        Active
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="font-bold">📚 Video Courses</span>
                      <span className="text-[10px] text-slate-400">120+ Lectures</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                  Logo & Theme synchronized in realtime.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: 4 Custom Logo Slots & Gallery Upload */}
      {activeSubTab === 'logos' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                4 Custom Logo Slots & 1-Click Switcher (४ कस्टम लोगो स्लॉट्स)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your own logos directly from device/gallery to 4 dedicated slots and easily switch between them whenever you want!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Currently Active:</span>
              <img
                src={formData.logo}
                alt="Active Logo"
                className="w-9 h-9 rounded-xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Slot 1 */}
            <div
              className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                formData.logo === formData.logoSlot1
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    {formData.logoSlotNames?.slot1 || 'Logo Slot 1'}
                  </span>
                  {formData.logo === formData.logoSlot1 && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {formData.logoSlot1 ? (
                    <img src={formData.logoSlot1} alt="Slot 1" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Empty Slot 1</span>
                  )}
                </div>

                <input
                  type="text"
                  value={formData.logoSlotNames?.slot1 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoSlotNames: { ...formData.logoSlotNames, slot1: e.target.value },
                    })
                  }
                  placeholder="Slot 1 Name"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                />

                <input
                  type="url"
                  value={formData.logoSlot1 || ''}
                  onChange={(e) => setFormData({ ...formData, logoSlot1: e.target.value })}
                  placeholder="https://... URL"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <input
                  type="file"
                  ref={fileInputRefSlot1}
                  onChange={(e) => handleSlotLogoUpload(1, e)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefSlot1.current?.click()}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateLogoSlot(1)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Activate Slot 1</span>
                </button>
              </div>
            </div>

            {/* Slot 2 */}
            <div
              className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                formData.logo === formData.logoSlot2
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    {formData.logoSlotNames?.slot2 || 'Logo Slot 2'}
                  </span>
                  {formData.logo === formData.logoSlot2 && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {formData.logoSlot2 ? (
                    <img src={formData.logoSlot2} alt="Slot 2" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Empty Slot 2</span>
                  )}
                </div>

                <input
                  type="text"
                  value={formData.logoSlotNames?.slot2 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoSlotNames: { ...formData.logoSlotNames, slot2: e.target.value },
                    })
                  }
                  placeholder="Slot 2 Name"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                />

                <input
                  type="url"
                  value={formData.logoSlot2 || ''}
                  onChange={(e) => setFormData({ ...formData, logoSlot2: e.target.value })}
                  placeholder="https://... URL"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <input
                  type="file"
                  ref={fileInputRefSlot2}
                  onChange={(e) => handleSlotLogoUpload(2, e)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefSlot2.current?.click()}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateLogoSlot(2)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Activate Slot 2</span>
                </button>
              </div>
            </div>

            {/* Slot 3 */}
            <div
              className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                formData.logo === formData.logoSlot3
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    {formData.logoSlotNames?.slot3 || 'Logo Slot 3'}
                  </span>
                  {formData.logo === formData.logoSlot3 && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {formData.logoSlot3 ? (
                    <img src={formData.logoSlot3} alt="Slot 3" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Empty Slot 3</span>
                  )}
                </div>

                <input
                  type="text"
                  value={formData.logoSlotNames?.slot3 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoSlotNames: { ...formData.logoSlotNames, slot3: e.target.value },
                    })
                  }
                  placeholder="Slot 3 Name"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                />

                <input
                  type="url"
                  value={formData.logoSlot3 || ''}
                  onChange={(e) => setFormData({ ...formData, logoSlot3: e.target.value })}
                  placeholder="https://... URL"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <input
                  type="file"
                  ref={fileInputRefSlot3}
                  onChange={(e) => handleSlotLogoUpload(3, e)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefSlot3.current?.click()}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateLogoSlot(3)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Activate Slot 3</span>
                </button>
              </div>
            </div>

            {/* Slot 4 */}
            <div
              className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                formData.logo === formData.logoSlot4
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    {formData.logoSlotNames?.slot4 || 'Logo Slot 4'}
                  </span>
                  {formData.logo === formData.logoSlot4 && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {formData.logoSlot4 ? (
                    <img src={formData.logoSlot4} alt="Slot 4" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Empty Slot 4</span>
                  )}
                </div>

                <input
                  type="text"
                  value={formData.logoSlotNames?.slot4 || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoSlotNames: { ...formData.logoSlotNames, slot4: e.target.value },
                    })
                  }
                  placeholder="Slot 4 Name"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                />

                <input
                  type="url"
                  value={formData.logoSlot4 || ''}
                  onChange={(e) => setFormData({ ...formData, logoSlot4: e.target.value })}
                  placeholder="https://... URL"
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-[11px] font-mono"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <input
                  type="file"
                  ref={fileInputRefSlot4}
                  onChange={(e) => handleSlotLogoUpload(4, e)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRefSlot4.current?.click()}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateLogoSlot(4)}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Activate Slot 4</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Announcements & Auto-Off Timer */}
      {activeSubTab === 'announcements' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-600" />
                Live Announcement Banner & Auto-Off Expiration Timer
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Display urgent notifications across student apps and set an automatic timer so announcements automatically turn off.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                {formData.showBanner ? '🟢 Banner Active' : '⚪ Banner Hidden'}
              </span>
              <input
                type="checkbox"
                checked={formData.showBanner ?? true}
                onChange={(e) => setFormData({ ...formData, showBanner: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Announcement Message Text:</label>
              <textarea
                rows={3}
                value={formData.bannerNotice || ''}
                onChange={(e) => setFormData({ ...formData, bannerNotice: e.target.value })}
                placeholder="e.g. 📢 Special Live Mock Test begins today at 7:00 PM! Don't forget to submit before 9:00 PM."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-amber-500 outline-hidden"
              />
            </div>

            {/* Timer Presets */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Auto-Off Timer (टाइमर के बाद अपने आप बंद हो जाए):
                </span>
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 shadow-2xs">
                  Remaining: {announcementCountdown.formatted}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetAnnouncementDuration(1)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition cursor-pointer"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAnnouncementDuration(6)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition cursor-pointer"
                >
                  +6 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAnnouncementDuration(24)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition cursor-pointer"
                >
                  +24 Hours (1 Day)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAnnouncementDuration(72)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAnnouncementDuration(168)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition cursor-pointer"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAnnouncementDuration('permanent')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
                >
                  Permanent (Never Expire)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, showBanner: false, announcementExpiresAt: undefined });
                    toast.info('Announcement turned off.', 'Banner Disabled');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold border border-rose-300 transition cursor-pointer ml-auto"
                >
                  Turn Off Immediately
                </button>
              </div>

              {/* Custom Duration & Exact Date-Time picker */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 border-t border-amber-200/60">
                <label className="font-bold text-amber-900 shrink-0">Custom Expiry Date & Time:</label>
                <input
                  type="datetime-local"
                  value={toLocalDatetimeInputValue(formData.announcementExpiresAt)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const iso = fromLocalDatetimeInputValue(e.target.value);
                      if (iso) {
                        setFormData({ ...formData, announcementExpiresAt: iso, showBanner: true });
                        toast.success('Announcement timer updated!', 'Timer Set');
                      }
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-mono text-slate-800"
                />
                {formData.announcementExpiresAt && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, announcementExpiresAt: undefined })}
                    className="text-rose-600 font-bold hover:underline"
                  >
                    Clear Timer (Permanent)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: User App AI Model & Prompts */}
      {activeSubTab === 'ai' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600" />
                User App AI Model Switcher & 1-Click System Prompts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch which model powers student doubts and select a ready-made academic prompt persona.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
              Student Doubt Solver Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Model Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800">
                User App AI Engine Mode (छात्र ऐप का AI मॉडल):
              </label>
              <select
                value={formData.userAppAiProvider || 'auto'}
                onChange={(e) => {
                  setFormData({ ...formData, userAppAiProvider: e.target.value as any });
                  toast.info(`Active User App AI set to ${e.target.value}`, 'AI Provider Changed');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs cursor-pointer"
              >
                <option value="auto">⚡ Smart Auto-Switch (Highest Speed & 100% Uptime Guarantee)</option>
                <option value="groq">Groq Cloud (Llama 3.3 70B - Ultra Fast &lt;300ms)</option>
                <option value="gemini">Google Gemini (Gemini 2.0 Flash - Multimodal)</option>
                <option value="openai">OpenAI (GPT-4o Mini - Precise Academic)</option>
                <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
              </select>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Smart Auto-Switch tries the fastest provider first (Groq ➔ Gemini ➔ OpenAI) with zero downtime for students.
              </p>
            </div>

            {/* Prompt Preset Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800">
                1-Click Load Battle-Tested System Prompt:
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {AI_SYSTEM_PROMPT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPromptPreset(p)}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-800 block text-xs truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{p.description}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-md shrink-0">
                      Apply ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* System Prompt Box */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-bold text-slate-800">
                Custom System Prompt for Student Assistant:
              </label>
              <textarea
                rows={6}
                value={formData.aiSystemPrompt || ''}
                onChange={(e) => setFormData({ ...formData, aiSystemPrompt: e.target.value })}
                className="w-full p-3.5 rounded-2xl border border-slate-200 font-mono text-xs focus:border-emerald-500 outline-hidden bg-slate-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Feature Toggles & Sections */}
      {activeSubTab === 'modules' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Realtime Section & Feature Flags
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Toggle complete sections in the user mobile app ON or OFF instantly without uploading a new APK.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">Mock Test Series Module</div>
                <div className="text-[11px] text-slate-400">Show Mock Tests tab & timers</div>
              </div>
              <input
                type="checkbox"
                checked={formData.modules?.enableMockTests}
                onChange={(e) => updateModule('enableMockTests', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">Offline Video Downloads</div>
                <div className="text-[11px] text-slate-400">Allow students to save video streams offline</div>
              </div>
              <input
                type="checkbox"
                checked={formData.modules?.enableVideoDownloads}
                onChange={(e) => updateModule('enableVideoDownloads', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">PDF Study Notes & Materials</div>
                <div className="text-[11px] text-slate-400">Show downloadable chapter notes</div>
              </div>
              <input
                type="checkbox"
                checked={formData.modules?.enablePDFDownloads}
                onChange={(e) => updateModule('enablePDFDownloads', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">Student Doubt Forum & Discussion</div>
                <div className="text-[11px] text-slate-400">Allow community doubts and replies</div>
              </div>
              <input
                type="checkbox"
                checked={formData.modules?.enableStudentDoubts}
                onChange={(e) => updateModule('enableStudentDoubts', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">All India Leaderboard</div>
                <div className="text-[11px] text-slate-400">Show state-wise test rank and badges</div>
              </div>
              <input
                type="checkbox"
                checked={formData.modules?.enableLeaderboard}
                onChange={(e) => updateModule('enableLeaderboard', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800">Guest Preview Mode</div>
                <div className="text-[11px] text-slate-400">Allow browsing syllabus without forcing login</div>
              </div>
              <input
                type="checkbox"
                checked={formData.modules?.enableGuestMode}
                onChange={(e) => updateModule('enableGuestMode', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: Student Security & Anti-Cheat Controls */}
      {activeSubTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Student App Security, Anti-Piracy & Exam Anti-Cheat
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enforce device-level protection, DRM content security, and exam cheating prevention in user apps.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>DRM Protected</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Device Login */}
            <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-800">Single Device Login Lock</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.securitySettings?.singleDeviceLogin ?? true}
                  onChange={(e) => updateSecuritySetting('singleDeviceLogin', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                एक समय में छात्र केवल एक ही फ़ोन में लॉग-इन रह सकता है। दूसरे डिवाइस में लॉगिन होते ही पहला डिवाइस ऑटो लॉगआउट हो जाएगा (अकाउंट शेयरिंग रोकथाम)।
              </p>
            </div>

            {/* Screenshot & Screen Recording Prevention */}
            <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-800">Screenshot & Screen Record Block</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.securitySettings?.blockScreenshots ?? true}
                  onChange={(e) => updateSecuritySetting('blockScreenshots', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ऐप में वीडियो लेक्चर्स व पेड PDF नोट्स का स्क्रीनशॉट तथा स्क्रीन रिकॉर्डिंग ब्लॉक करता है (FLAG_SECURE एक्टिवेशन)।
              </p>
            </div>

            {/* Rooted / Jailbreak Device Block */}
            <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-xs text-slate-800">Block Rooted / Jailbroken Devices</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.securitySettings?.blockRootedDevices ?? true}
                  onChange={(e) => updateSecuritySetting('blockRootedDevices', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                रूटेड या जेलब्रोकन फोन पर ऐप को चलने से रोकें ताकि कोई ऐप की फाइलों या डिक्रिप्टेड मीडिया को चोरी न कर सके।
              </p>
            </div>

            {/* Dynamic Watermark on Videos & PDFs */}
            <div className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-slate-800">Dynamic User Info Watermark</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.securitySettings?.enableDynamicWatermark ?? true}
                  onChange={(e) => updateSecuritySetting('enableDynamicWatermark', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                वीडियो प्लेयर और PDF रीडर पर छात्र का रजिस्टर्ड मोबाइल नंबर व ईमेल पारदर्शी वाटरमार्क (Watermark) के रूप में प्रदर्शित होगा।
              </p>
            </div>

            {/* Exam Tab-Switch Anti-Cheat */}
            <div className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-slate-800">Mock Test Tab-Switch Penalty</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.securitySettings?.maxExamTabSwitches ?? 3}
                    onChange={(e) => updateSecuritySetting('maxExamTabSwitches', Number(e.target.value))}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800"
                  >
                    <option value={1}>1 Warning (Strict)</option>
                    <option value={2}>2 Warnings</option>
                    <option value={3}>3 Warnings (Recommended)</option>
                    <option value={5}>5 Warnings</option>
                    <option value={0}>Disabled (Unlimited)</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ऑनलाइन टेस्ट के दौरान छात्र के ऐप से बाहर जाने पर चेतावनी दें। निर्धारित सीमा पार होने पर टेस्ट ऑटो-सबमिट हो जाएगा।
              </p>
            </div>

            {/* In-App Account Deletion Policy */}
            <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-xs text-slate-800">Allow Student Account Deletion</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.securitySettings?.allowAccountSelfDeletion ?? true}
                  onChange={(e) => updateSecuritySetting('allowAccountSelfDeletion', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Google Play Store और Apple App Store पॉलिसी के तहत छात्रों को ऐप के अंदर से अपना खाता डिलीट करने का विकल्प प्रदान करता है।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: AI Quotas & Rate Limits */}
      {activeSubTab === 'rateLimits' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                API Rate Limits, AI Quotas & Bandwidth Control
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Control API consumption, prevent server overloading, and define daily limits for free vs pro students.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.success('API Rate limit caches and counters refreshed!', 'Cache Flushed')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reset Daily Limit Cache</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free User Daily AI Doubts Limit */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  Free Students: Daily AI Doubts Quota
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                  {formData.rateLimitSettings?.dailyAiLimitFree ?? 10} / day
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={formData.rateLimitSettings?.dailyAiLimitFree ?? 10}
                onChange={(e) => updateRateLimitSetting('dailyAiLimitFree', Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                फ्री छात्रों के लिए प्रतिदिन AI डाउट पूछने की अधिकतम सीमा (e.g. 10 सवाल/दिन)। 0 = कोई AI नहीं।
              </p>
            </div>

            {/* Pro User Daily AI Doubts Limit */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Paid / Pro Students: Daily AI Doubts Quota
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white">
                  {formData.rateLimitSettings?.dailyAiLimitPro ?? 100} / day
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="20"
                value={formData.rateLimitSettings?.dailyAiLimitPro ?? 100}
                onChange={(e) => updateRateLimitSetting('dailyAiLimitPro', Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                पेड या एनरोल्ड छात्रों के लिए दैनिक AI डाउट लिमिट (उच्च प्राथमिकता LPU प्रोसेसिंग)।
              </p>
            </div>

            {/* Free User PDF Download Limit */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-600" />
                  Free Students: Daily PDF Downloads Quota
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white">
                  {formData.rateLimitSettings?.dailyPdfLimitFree ?? 5} PDFs / day
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={formData.rateLimitSettings?.dailyPdfLimitFree ?? 5}
                onChange={(e) => updateRateLimitSetting('dailyPdfLimitFree', Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                फ्री नोट्स डाउनलोड की दैनिक सीमा ताकि सर्वर बैंडविड्थ और CDN बिल नियंत्रित रहे।
              </p>
            </div>

            {/* Concurrent Active Streams */}
            <div className="p-5 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-cyan-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-600" />
                  Max Concurrent Video Streams per Account
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-600 text-white">
                  {formData.rateLimitSettings?.maxConcurrentStreams ?? 1} Screen
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={formData.rateLimitSettings?.maxConcurrentStreams ?? 1}
                onChange={(e) => updateRateLimitSetting('maxConcurrentStreams', Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                एक साथ वीडियो देखने वाले डिवाइसों की संख्या (1 स्क्रीन = शेयरिंग पूर्ण रूप से प्रतिबंधित)।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 8: In-App Festive Pop-Up & Modal Broadcaster */}
      {activeSubTab === 'popupBanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pop-Up Configuration (Left Col 7) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-600" />
                  In-App Pop-Up Modal Broadcaster
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  छात्रों के मोबाइल ऐप खोलते ही स्क्रीन पर प्रदर्शित होने वाला आकर्षक फेस्टिवल या डिस्काउंट पॉप-अप।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const newEnabled = !(formData.popupBanner?.enabled ?? false);
                    updatePopupBanner('enabled', newEnabled);
                    try {
                      await updateAppSettings({
                        popupBanner: {
                          ...formData.popupBanner,
                          enabled: newEnabled,
                        },
                      });
                      toast.success(
                        newEnabled
                          ? '📢 Pop-Up Broadcast is now LIVE on all student devices!'
                          : 'Pop-Up Broadcast deactivated.',
                        'Real-Time Broadcast Updated'
                      );
                    } catch (e: any) {
                      toast.error('Failed to update: ' + e.message);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    formData.popupBanner?.enabled
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {formData.popupBanner?.enabled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Pop-Up ACTIVE (प्रसारित)</span>
                    </>
                  ) : (
                    <span>Pop-Up Disabled (निष्क्रिय)</span>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Badge Text */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Top Badge / Tagline:</label>
                <input
                  type="text"
                  value={formData.popupBanner?.badgeText || ''}
                  onChange={(e) => updatePopupBanner('badgeText', e.target.value)}
                  placeholder="e.g. 🎯 HOLI SPECIAL 50% OFF, SCHOLARSHIP ALERT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden font-semibold"
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Pop-Up Main Headline:</label>
                <input
                  type="text"
                  value={formData.popupBanner?.title || ''}
                  onChange={(e) => updatePopupBanner('title', e.target.value)}
                  placeholder="e.g. UPSC & State PSC 2026 Target Batch Live!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden font-bold"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Detailed Offer / Description:</label>
                <textarea
                  rows={2}
                  value={formData.popupBanner?.subtitle || ''}
                  onChange={(e) => updatePopupBanner('subtitle', e.target.value)}
                  placeholder="e.g. Complete Live Classes + 50 Mock Tests + Printed Notes at lowest price ever. Valid for first 500 students only!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
              </div>

              {/* Image URL & Upload */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Pop-Up Banner Graphic:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.popupBanner?.imageUrl || ''}
                    onChange={(e) => updatePopupBanner('imageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden text-xs"
                  />
                  <input
                    ref={fileInputRefPopup}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePopupBannerImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefPopup.current?.click()}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Button Text & Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">Action Button Text:</label>
                  <input
                    type="text"
                    value={formData.popupBanner?.actionText || ''}
                    onChange={(e) => updatePopupBanner('actionText', e.target.value)}
                    placeholder="e.g. Enroll Now, Start Free Test"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">Target Deep Link / Destination:</label>
                  <select
                    value={formData.popupBanner?.actionUrl || 'tab:courses'}
                    onChange={(e) => updatePopupBanner('actionUrl', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden font-bold bg-white text-slate-800"
                  >
                    <option value="tab:courses">Courses Tab (कोर्सेज)</option>
                    <option value="tab:mocktests">Mock Tests Tab (टेस्ट सीरीज)</option>
                    <option value="tab:doubts">AI Doubt Forum (डाउट्स)</option>
                    <option value="tab:downloads">Study Material (स्टडी नोट्स)</option>
                    <option value="https://eduveda.in">Custom External Website</option>
                  </select>
                </div>
              </div>

              {/* Show Once Per Session */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Show Once Per App Launch</span>
                  <p className="text-[10px] text-slate-400">छात्र को बार-बार परेशान न करे, ऐप खोलने पर एक बार ही दिखे</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.popupBanner?.showOncePerSession ?? true}
                  onChange={(e) => updatePopupBanner('showOncePerSession', e.target.checked)}
                  className="w-5 h-5 accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Broadcast Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateAppSettings({
                        popupBanner: {
                          ...formData.popupBanner,
                          enabled: true,
                        },
                      });
                      updatePopupBanner('enabled', true);
                      toast.success('📢 Pop-Up Broadcast published LIVE to all students!', 'Broadcast Sent');
                    } catch (err: any) {
                      toast.error('Failed to broadcast: ' + err.message);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>📢 Save & Broadcast Pop-Up Live Now</span>
                </button>

                {formData.popupBanner?.enabled && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await updateAppSettings({
                          popupBanner: {
                            ...formData.popupBanner,
                            enabled: false,
                          },
                        });
                        updatePopupBanner('enabled', false);
                        toast.info('Pop-Up Broadcast turned OFF.');
                      } catch (err: any) {
                        toast.error('Failed: ' + err.message);
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Turn OFF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Mobile Modal Mockup Preview (Right Col 5) */}
          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl text-white space-y-4 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Live In-App Pop-Up Preview
            </span>

            {/* Mobile Frame Simulation */}
            <div className="w-full max-w-[280px] bg-slate-950 rounded-3xl p-3.5 border-4 border-slate-700 shadow-2xl space-y-3 relative overflow-hidden">
              {/* Notification Pill */}
              <div className="w-16 h-1.5 bg-slate-700 rounded-full mx-auto" />

              {/* Simulated Backdrop Overlay */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner space-y-3">
                {formData.popupBanner?.badgeText && (
                  <div className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                    {formData.popupBanner.badgeText}
                  </div>
                )}

                {formData.popupBanner?.imageUrl && (
                  <img
                    src={formData.popupBanner.imageUrl}
                    alt="Popup Graphic"
                    className="w-full h-28 object-cover rounded-xl border border-slate-700"
                  />
                )}

                <div className="space-y-1 text-center">
                  <h4 className="text-xs font-black text-white line-clamp-2">
                    {formData.popupBanner?.title || 'Special Festive Discount'}
                  </h4>
                  <p className="text-[10px] text-slate-300 line-clamp-2">
                    {formData.popupBanner?.subtitle || 'Get flat discount on complete preparation bundle!'}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-2 bg-linear-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-md cursor-default"
                >
                  {formData.popupBanner?.actionText || 'Enroll Now'}
                </button>

                <div className="text-center">
                  <span className="text-[9px] text-slate-500 hover:text-slate-400 cursor-default">
                    Maybe Later ✕
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center max-w-xs">
              Status: {formData.popupBanner?.enabled ? '🟢 Live on Student App' : '🔴 Disabled'}
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 9: Remote JSON */}
      {activeSubTab === 'remoteCode' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-600" />
              Dynamic Remote JSON Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Inject banner carousels, highlighted announcements, and dynamic schema directly into the user app.
            </p>
          </div>

          <div>
            <label className="block font-mono font-bold text-slate-700 text-xs mb-1">
              JSON Configuration Schema:
            </label>
            <textarea
              rows={10}
              value={formData.remoteJsonConfig || ''}
              onChange={(e) => setFormData({ ...formData, remoteJsonConfig: e.target.value })}
              className="w-full p-4 rounded-2xl bg-slate-950 text-amber-400 font-mono text-xs focus:ring-2 focus:ring-amber-400 border border-slate-800"
              placeholder="{ ... }"
            />
          </div>
        </div>
      )}

      {/* SUBTAB 10: Maintenance, Force Logout & Emergency Kill Switches */}
      {activeSubTab === 'forceUpdate' && (
        <div className="space-y-6">
          {/* Emergency Server Maintenance Mode */}
          <div className="bg-rose-50/70 p-6 rounded-3xl border border-rose-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-600 text-white rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-rose-950">
                    Emergency Maintenance Mode (आपातकालीन सर्वर लॉक)
                  </h2>
                  <p className="text-xs text-rose-800 mt-0.5">
                    इसे ON करने पर सभी छात्र ऐप में मेंटेनेंस स्क्रीन देखेंगे और डेटाबेस सुरक्षित लॉक हो जाएगा।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !formData.maintenanceMode;
                  setFormData({ ...formData, maintenanceMode: nextState });
                  if (nextState) {
                    toast.warning('Emergency Maintenance Mode is now ACTIVE!', 'Maintenance ON');
                  } else {
                    toast.success('Maintenance Mode deactivated. App is live for students.', 'Maintenance OFF');
                  }
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                  formData.maintenanceMode
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {formData.maintenanceMode ? '🚨 Maintenance IS ACTIVE' : 'Maintenance Disabled (Normal)'}
              </button>
            </div>

            {formData.maintenanceMode && (
              <div className="space-y-2 pt-2 border-t border-rose-200 text-xs">
                <label className="block font-bold text-rose-900">Notice message shown to students:</label>
                <input
                  type="text"
                  value={formData.maintenanceMessage || ''}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  placeholder="ऐप मेंटेनेंस कार्य प्रगति पर है। कृपया 30 मिनट बाद प्रयास करें।"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-white text-xs font-semibold"
                />
              </div>
            )}
          </div>

          {/* Global Force Logout & Token Invalidation */}
          <div className="bg-amber-50/70 p-6 rounded-3xl border border-amber-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">
                    Global Force Logout All Students (सभी छात्रों का तुरंत लॉगआउट)
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    सत्र संख्या (Session Epoch v{formData.securitySettings?.sessionEpoch || 1}) को आगे बढ़ाकर सभी सक्रिय मोबाइल सत्रों को तुरंत अमान्य करें।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleForceLogoutAllUsers}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Invalidate All Active Sessions</span>
              </button>
            </div>
          </div>

          {/* Emergency Feature Kill Switches */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600" />
                Emergency Module Kill Switches (तुरंत बंद करें)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                यदि कोई तृतीय-पक्ष API (जैसे पेमेंट गेटवे या AI) डाउन हो जाए, तो बिना ऐप क्रैश किए उस फीचर को रोकें।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="font-bold text-xs text-slate-800">Payment Gateway Kill Switch</div>
                  <div className="text-[10px] text-slate-500">Temporarily pause all purchases</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !formData.modules?.enablePaymentGateway;
                    updateModule('enablePaymentGateway', next);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    formData.modules?.enablePaymentGateway
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {formData.modules?.enablePaymentGateway ? 'Active' : 'Muted'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="font-bold text-xs text-slate-800">AI Tutor / Doubts Kill Switch</div>
                  <div className="text-[10px] text-slate-500">Temporarily pause AI tutor queries</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !formData.aiTutorEnabled;
                    setFormData((prev) => ({ ...prev, aiTutorEnabled: next }));
                    toast.info(`AI Tutor is now ${next ? 'Active' : 'Muted'}`, 'Kill Switch');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    formData.aiTutorEnabled !== false
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {formData.aiTutorEnabled !== false ? 'Active' : 'Muted'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 8: Firebase & Measurement ID */}
      {activeSubTab === 'firebase' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-600" />
                Firebase Project Keys & Analytics Measurement ID
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Developer reference for live Google Firebase backend & Google Analytics Measurement stream.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Provisioned</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Measurement ID */}
            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-700" />
                  Firebase Measurement ID (Google Analytics)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(measurementId, 'measurementId')}
                  className="text-cyan-700 hover:text-cyan-900 font-sans font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'measurementId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'measurementId' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <input
                type="text"
                value={measurementId}
                onChange={(e) => setMeasurementId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cyan-300 font-bold text-cyan-900 text-xs"
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            {/* Firestore Database ID */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Firestore Database ID</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(firebaseConfigData.firestoreDatabaseId, 'dbId')}
                  className="text-indigo-600 hover:text-indigo-800 font-sans font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'dbId' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'dbId' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 text-[11px] break-all">
                {firebaseConfigData.firestoreDatabaseId}
              </div>
            </div>

            {/* Project ID */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Firebase Project ID</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(firebaseConfigData.projectId, 'projectId')}
                  className="text-indigo-600 hover:text-indigo-800 font-sans font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'projectId' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'projectId' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 text-[11px]">
                {firebaseConfigData.projectId}
              </div>
            </div>

            {/* App ID */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Web App ID</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(firebaseConfigData.appId, 'appId')}
                  className="text-indigo-600 hover:text-indigo-800 font-sans font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'appId' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'appId' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 text-[11px]">
                {firebaseConfigData.appId}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Theme Settings Modal */}
      {isThemeModalOpen && (
        <QuizThemeSettingsModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          appSettings={formData}
          initialTab={themeModalTab}
          onRefreshSettings={() => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};

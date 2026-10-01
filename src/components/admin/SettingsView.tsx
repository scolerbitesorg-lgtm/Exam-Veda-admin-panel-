import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  AlertTriangle,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  Palette,
  Shield,
  Megaphone,
  Trash2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Link,
  Smartphone,
  Timer,
  Clock,
  Zap,
  Key,
  Eye,
  EyeOff,
  Cpu,
  Video,
  CreditCard,
  Plus,
} from 'lucide-react';
import { updateAppSettings, clearAllEducationalData } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { compressAndReadImageFile } from '../../utils/imageUtils';
import {
  formatTimeRemaining,
  calculateExpiryTimestamp,
  toLocalDatetimeInputValue,
  fromLocalDatetimeInputValue,
} from '../../utils/announcementUtils';
import type { AppSettings, MultiAISettings } from '../../types';

interface SettingsViewProps {
  appSettings: AppSettings;
  onRefreshSettings: () => void;
}

const DEFAULT_APP_LOGO =
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80';

export const SettingsView: React.FC<SettingsViewProps> = ({
  appSettings,
  onRefreshSettings,
}) => {
  const { isDeveloper } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState<AppSettings>({
    ...appSettings,
    logoSlot1: appSettings.logoSlot1 || DEFAULT_APP_LOGO,
    logoSlot2: appSettings.logoSlot2 || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&auto=format&fit=crop&q=80',
    logoSlot3: appSettings.logoSlot3 || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&auto=format&fit=crop&q=80',
    logoSlot4: appSettings.logoSlot4 || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&auto=format&fit=crop&q=80',
    logoSlotNames: {
      slot1: appSettings.logoSlotNames?.slot1 || 'Slot 1 (Gold Crest)',
      slot2: appSettings.logoSlotNames?.slot2 || 'Slot 2 (Brain & Quill)',
      slot3: appSettings.logoSlotNames?.slot3 || 'Slot 3 (Shield Badge)',
      slot4: appSettings.logoSlotNames?.slot4 || 'Slot 4 (Custom Emblem)',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefSlot1 = useRef<HTMLInputElement>(null);
  const fileInputRefSlot2 = useRef<HTMLInputElement>(null);
  const fileInputRefSlot3 = useRef<HTMLInputElement>(null);
  const fileInputRefSlot4 = useRef<HTMLInputElement>(null);

  // Countdown clock for Announcement
  const [announcementCountdown, setAnnouncementCountdown] = useState(
    formatTimeRemaining(formData.announcementExpiresAt)
  );

  const [customAnnounceVal, setCustomAnnounceVal] = useState<string>('2');
  const [customAnnounceUnit, setCustomAnnounceUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('minutes');
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSetCustomAnnouncementTime = () => {
    const num = parseInt(customAnnounceVal, 10);
    if (isNaN(num) || num <= 0) {
      toast.warning('Please enter a valid time duration greater than 0 (e.g., 2, 3, 4 mins).', 'Invalid Time');
      return;
    }
    const iso = calculateExpiryTimestamp(num, customAnnounceUnit);
    setFormData((prev) => ({
      ...prev,
      showBanner: true,
      announcementExpiresAt: iso,
    }));
    toast.success(`Announcement / Advertising timer set for ${num} ${customAnnounceUnit}!`, 'Timer Active');
  };

  const handleTurnOffAnnouncement = () => {
    setFormData((prev) => ({
      ...prev,
      showBanner: false,
      announcementExpiresAt: undefined,
    }));
    toast.info('Announcement banner deactivated.', 'Banner Turned Off');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementCountdown(formatTimeRemaining(formData.announcementExpiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [formData.announcementExpiresAt]);

  const handleDeviceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressAndReadImageFile(file, 400, 400, 0.9);
      setFormData((prev) => ({
        ...prev,
        logo: dataUrl,
      }));
      toast.success('Logo uploaded from device and ready to save!', 'Upload Successful');
    } catch (err: any) {
      toast.error(`Logo upload error: ${err.message}`, 'Upload Failed');
    }
  };

  const handleSlotLogoUpload = async (slotNum: 1 | 2 | 3 | 4, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressAndReadImageFile(file, 400, 400, 0.9);
      const slotKey = `logoSlot${slotNum}` as keyof AppSettings;
      setFormData((prev) => ({
        ...prev,
        [slotKey]: dataUrl,
      }));
      toast.success(`Custom image uploaded into Logo Slot ${slotNum}! Click 'Save Settings' to sync.`, 'Slot Updated');
    } catch (err: any) {
      toast.error(`Slot upload error: ${err.message}`, 'Upload Failed');
    }
  };

  const handleActivateSlot = (slotNum: 1 | 2 | 3 | 4) => {
    const slotKey = `logoSlot${slotNum}` as keyof AppSettings;
    const url = formData[slotKey] as string;
    if (!url) {
      toast.warning(`Slot ${slotNum} is empty. Upload or set a URL first.`, 'Slot Empty');
      return;
    }
    setFormData((prev) => ({ ...prev, logo: url }));
    toast.success(`⚡ Logo Slot ${slotNum} set as active App Logo!`, 'Logo Switched');
  };

  const handleResetLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: DEFAULT_APP_LOGO,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Logo reset to default golden emblem.', 'Logo Reset');
  };

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
      toast.success(`Announcement timer set for ${hours} hours!`, 'Timer Set');
    }
  };

  const handlePurgeAllData = async () => {
    if (!isDeveloper) {
      toast.error('Only Lead Developer has permission to purge database records.', 'Permission Denied');
      return;
    }
    if (
      !window.confirm(
        '⚠️ Are you ABSOLUTELY sure? This will remove all subjects, chapters, video lectures, PDF notes, MCQs question bank, and mock tests from Firestore. This action is permanent!'
      )
    ) {
      return;
    }
    setIsPurging(true);
    setPurgeSuccess(null);
    try {
      const res = await clearAllEducationalData();
      const msg = `Successfully wiped all ${res.deletedCount} items from the database.`;
      setPurgeSuccess(msg);
      toast.success(msg, 'Database Purged');
      setTimeout(() => setPurgeSuccess(null), 5000);
    } catch (err: any) {
      toast.error(`Error purging database: ${err.message}`, 'Purge Failed');
    } finally {
      setIsPurging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const trimmedGeminiKey = formData.geminiApiKey?.trim() || '';
      const trimmedGroqKey = formData.groqApiKey?.trim() || '';
      const existingMulti = formData.aiMultiProviders || {
        enableAutoFailover: true,
        activeOrder: ['gemini', 'groq', 'openai', 'anthropic'],
      };
      const existingProviders = existingMulti.providers || {};

      const updatedMulti: MultiAISettings = {
        ...existingMulti,
        providers: {
          ...existingProviders,
          ...(trimmedGeminiKey
            ? {
                gemini: {
                  ...(existingProviders['gemini'] || {
                    id: 'gemini',
                    name: 'Google Gemini',
                    enabled: true,
                    model: 'gemini-2.5-flash',
                    priority: 1,
                  }),
                  apiKey: trimmedGeminiKey,
                },
              }
            : {}),
          ...(trimmedGroqKey
            ? {
                groq: {
                  ...(existingProviders['groq'] || {
                    id: 'groq',
                    name: 'Groq Cloud',
                    enabled: true,
                    model: 'llama-3.3-70b-versatile',
                    priority: 2,
                  }),
                  apiKey: trimmedGroqKey,
                },
              }
            : {}),
        },
      };

      const updatedFormData: AppSettings = {
        ...formData,
        geminiApiKey: trimmedGeminiKey,
        groqApiKey: trimmedGroqKey,
        aiMultiProviders: updatedMulti,
      };

      await updateAppSettings(updatedFormData);
      setSaveSuccess(true);
      toast.success('App settings synchronized with Firestore (appSettings/general)!', 'Changes Saved');
      onRefreshSettings();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(`Error updating settings: ${err.message}`, 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceToggle = async (val: boolean) => {
    setFormData((prev) => ({ ...prev, maintenanceMode: val }));
    try {
      await updateAppSettings({ maintenanceMode: val });
      if (val) {
        toast.warning('Emergency Maintenance Mode is now ACTIVE on Firestore!', 'Maintenance ON');
      } else {
        toast.success('Maintenance Mode deactivated. App is live for students.', 'Maintenance OFF');
      }
      onRefreshSettings();
    } catch (err: any) {
      toast.error(`Failed to toggle maintenance mode: ${err.message}`, 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Settings & Branding</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage application logo, 4 preset slots, colors, announcement timer, contacts, and maintenance mode.
          </p>
        </div>

        {/* Maintenance Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <AlertTriangle
            className={`w-4 h-4 ${formData.maintenanceMode ? 'text-amber-500' : 'text-slate-400'}`}
          />
          <div className="text-xs">
            <span className="font-bold block text-slate-700">Maintenance Mode</span>
            <span className="text-[10px] text-slate-400">
              {formData.maintenanceMode ? 'App is Locked (Admin Only)' : 'App is Live for Students'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleMaintenanceToggle(!formData.maintenanceMode)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              formData.maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                formData.maintenanceMode ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-6 text-xs">
        {/* LOGO UPLOAD & BRANDING SECTION */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-indigo-50/40 to-slate-50 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-sm">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              <span>Brand Logo & Visual Identity (लोगो प्रबंधन)</span>
            </div>
            <button
              type="button"
              onClick={handleResetLogo}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Live Logo Preview Box */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Live Logo Preview
              </span>
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-2 shadow-inner">
                <img
                  src={formData.logo || DEFAULT_APP_LOGO}
                  alt="App Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_APP_LOGO;
                  }}
                />
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 mt-2">
                {formData.appName || 'Edu Veda'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Header & Login Logo</span>
            </div>

            {/* Upload from Device & Web URL Inputs */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Logo File from Device / Gallery (PNG / JPG / WebP)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleDeviceLogoUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-slate-400" />
                  <span>Or Enter Direct Image Web URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo || ''}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4 Quick Logo Slots with Upload & Custom Images */}
          <div className="pt-4 border-t border-indigo-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="font-extrabold text-slate-900 text-xs block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>4 Quick Switch Logo Slots (४ कस्टम लोगो स्लॉट्स - अपनी तस्वीरें अपलोड करें)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Upload your own logos directly from device/gallery to these 4 slots and switch between them anytime with 1-click!
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4].map((num) => {
                const slotKey = `logoSlot${num}` as keyof AppSettings;
                const slotUrl = (formData[slotKey] as string) || '';
                const isActive = formData.logo === slotUrl && !!slotUrl;
                const slotNameKey = `slot${num}` as 'slot1' | 'slot2' | 'slot3' | 'slot4';
                const slotName = formData.logoSlotNames?.[slotNameKey] || `Logo Slot ${num}`;
                const fileRef =
                  num === 1
                    ? fileInputRefSlot1
                    : num === 2
                    ? fileInputRefSlot2
                    : num === 3
                    ? fileInputRefSlot3
                    : fileInputRefSlot4;

                return (
                  <div
                    key={num}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-2.5 bg-white ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 line-clamp-1">
                          {slotName}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Image Box */}
                      <div className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center relative group p-1.5">
                        {slotUrl ? (
                          <img
                            src={slotUrl}
                            alt={`Slot ${num}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_APP_LOGO;
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-400 font-bold block">Empty Slot {num}</span>
                          </div>
                        )}
                      </div>

                      {/* Slot Name */}
                      <div>
                        <input
                          type="text"
                          value={formData.logoSlotNames?.[slotNameKey] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              logoSlotNames: {
                                ...formData.logoSlotNames,
                                [slotNameKey]: e.target.value,
                              },
                            })
                          }
                          placeholder={`Slot ${num} Name`}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold bg-white"
                        />
                      </div>

                      {/* URL input */}
                      <div>
                        <input
                          type="url"
                          value={slotUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [slotKey]: e.target.value,
                            })
                          }
                          placeholder="https://... URL"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-mono bg-white"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                      <input
                        type="file"
                        ref={fileRef}
                        accept="image/*"
                        onChange={(e) => handleSlotLogoUpload(num as any, e)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <Upload className="w-3 h-3 text-indigo-600" />
                          <span>Device Upload</span>
                        </button>

                        {slotUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                [slotKey]: '',
                              }));
                              toast.info(`Slot ${num} cleared.`, 'Slot Cleared');
                            }}
                            title="Clear this slot"
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleActivateSlot(num as any)}
                        disabled={!slotUrl}
                        className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{isActive ? '✓ Currently Active' : `⚡ Activate Slot ${num}`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GENERAL PLATFORM CONFIGURATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Application Name (ऐप का नाम)</span>
              <span className="text-[10px] text-indigo-600 font-semibold">Live in Student App</span>
            </label>
            <input
              type="text"
              required
              value={formData.appName}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              placeholder="e.g. Edu Veda Learning Hub"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 font-semibold bg-white"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Brand Tagline (टैगलाइन / उप-शीर्षक)</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. भारत का अग्रणी डिजिटल शिक्षा मंच"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Support Email */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Official Support Email (सपोर्ट ईमेल)</span>
            </label>
            <input
              type="email"
              required
              value={formData.supportEmail}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
              placeholder="support@eduveda.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 font-mono bg-white"
            />
          </div>

          {/* Support Phone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Helpline / WhatsApp Contact (हेल्पलाइन / व्हाट्सएप)</span>
            </label>
            <input
              type="text"
              required
              value={formData.supportPhone}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 font-mono bg-white"
            />
          </div>

          {/* Theme Color with Swatches */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span>Primary Theme Color (थीम कलर)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{formData.themeColor}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.themeColor}
                onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                className="w-10 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={formData.themeColor}
                onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                placeholder="#4f46e5"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs bg-white uppercase"
              />
            </div>
            {/* Quick Color Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { name: 'Indigo', color: '#4f46e5' },
                { name: 'Emerald', color: '#059669' },
                { name: 'Violet', color: '#7c3aed' },
                { name: 'Blue', color: '#2563eb' },
                { name: 'Amber', color: '#d97706' },
                { name: 'Rose', color: '#e11d48' },
                { name: 'Cyan', color: '#0891b2' },
                { name: 'Dark Slate', color: '#0f172a' },
              ].map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => setFormData({ ...formData, themeColor: swatch.color })}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                    formData.themeColor.toLowerCase() === swatch.color.toLowerCase()
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: swatch.color }}
                  />
                  <span>{swatch.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* App Version */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>App Release Version (ऐप वर्ज़न कोड)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                v{formData.version || '2.4.0'}
              </span>
            </label>
            <input
              type="text"
              required
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="2.4.0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Displayed in student app footer and used for version synchronization.
            </p>
          </div>
        </div>

        {/* Announcement Banner & Custom Expiration Timer */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-950 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-700" />
              <span>Top Announcement Banner & Auto-Off Timer (अनाउंसमेंट टाइमर)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                formData.showBanner && formData.bannerNotice?.trim() && !announcementCountdown.isExpired
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {formData.showBanner && formData.bannerNotice?.trim() && !announcementCountdown.isExpired
                  ? '● Live for Students'
                  : '○ Disabled / Off'}
              </span>
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showBanner ?? true}
                  onChange={(e) => setFormData({ ...formData, showBanner: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                />
                <span>Enable Banner</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">
              Banner Message (विद्यार्थियों को दिखने वाला सूचना संदेश):
            </label>
            <input
              type="text"
              placeholder="e.g. 🎉 New UPSC 2026 Foundation Batches Live! Enroll today."
              value={formData.bannerNotice || ''}
              onChange={(e) => setFormData({ ...formData, bannerNotice: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-xs focus:border-amber-500 font-medium"
            />
          </div>

          {/* Quick Duration Buttons */}
          <div className="space-y-2 pt-1 border-t border-amber-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Preset Durations (त्वरित समय सीमा):</span>
              </span>
              <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border shadow-2xs ${
                announcementCountdown.isExpired
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-white text-amber-950 border-amber-300'
              }`}>
                Remaining: {announcementCountdown.formatted}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const iso = calculateExpiryTimestamp(2, 'minutes');
                  setFormData((prev) => ({ ...prev, showBanner: true, announcementExpiresAt: iso }));
                  toast.success('⚡ Live banner timer set for 2 minutes!', 'Timer Set');
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px] cursor-pointer shadow-2xs"
              >
                +2 Mins (2 मिनट)
              </button>
              <button
                type="button"
                onClick={() => {
                  const iso = calculateExpiryTimestamp(3, 'minutes');
                  setFormData((prev) => ({ ...prev, showBanner: true, announcementExpiresAt: iso }));
                  toast.success('⚡ Live banner timer set for 3 minutes!', 'Timer Set');
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px] cursor-pointer shadow-2xs"
              >
                +3 Mins (3 मिनट)
              </button>
              <button
                type="button"
                onClick={() => {
                  const iso = calculateExpiryTimestamp(5, 'minutes');
                  setFormData((prev) => ({ ...prev, showBanner: true, announcementExpiresAt: iso }));
                  toast.success('⚡ Live banner timer set for 5 minutes!', 'Timer Set');
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px] cursor-pointer shadow-2xs"
              >
                +5 Mins
              </button>
              <button
                type="button"
                onClick={() => {
                  const iso = calculateExpiryTimestamp(15, 'minutes');
                  setFormData((prev) => ({ ...prev, showBanner: true, announcementExpiresAt: iso }));
                  toast.success('Announcement set for 15 minutes!', 'Timer Set');
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-[11px] cursor-pointer"
              >
                +15 Mins
              </button>
              <button
                type="button"
                onClick={() => handleSetAnnouncementDuration(1)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-[11px] cursor-pointer"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => handleSetAnnouncementDuration(6)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-[11px] cursor-pointer"
              >
                +6 Hours
              </button>
              <button
                type="button"
                onClick={() => handleSetAnnouncementDuration(24)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-[11px] cursor-pointer"
              >
                +24h (1 Day)
              </button>
              <button
                type="button"
                onClick={() => handleSetAnnouncementDuration(72)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 text-[11px] cursor-pointer"
              >
                +3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetAnnouncementDuration('permanent')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
              >
                Permanent (स्थायी)
              </button>
              <button
                type="button"
                onClick={handleTurnOffAnnouncement}
                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold border border-rose-300 text-[11px] cursor-pointer ml-auto"
              >
                Turn Off Immediately (तुरंत बंद करें)
              </button>
            </div>
          </div>

          {/* Custom Duration Builder */}
          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-700" />
                <span>Custom Duration (अपनी पसंद का कस्टम विज्ञापन / सूचना समय जोड़ें):</span>
              </span>
              {/* Quick minute shortcuts */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 font-medium">Quick:</span>
                {[
                  { label: '2m', val: '2', unit: 'minutes' as const },
                  { label: '3m', val: '3', unit: 'minutes' as const },
                  { label: '4m', val: '4', unit: 'minutes' as const },
                  { label: '5m', val: '5', unit: 'minutes' as const },
                  { label: '10m', val: '10', unit: 'minutes' as const },
                  { label: '30m', val: '30', unit: 'minutes' as const },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setCustomAnnounceVal(chip.val);
                      setCustomAnnounceUnit(chip.unit);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                      customAnnounceVal === chip.val && customAnnounceUnit === chip.unit
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 2, 3, 4"
                value={customAnnounceVal}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setCustomAnnounceVal(cleaned);
                }}
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white focus:border-amber-500 focus:outline-none"
              />
              <select
                value={customAnnounceUnit}
                onChange={(e) => setCustomAnnounceUnit(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="minutes">Minutes (मिनट)</option>
                <option value="hours">Hours (घंटे)</option>
                <option value="days">Days (दिन)</option>
                <option value="months">Months (महीने)</option>
              </select>

              <button
                type="button"
                onClick={handleSetCustomAnnouncementTime}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer transition shadow-2xs"
              >
                Apply Custom Timer ({customAnnounceVal ? customAnnounceVal : '...'} {customAnnounceUnit} सेट करें)
              </button>

              {customAnnounceVal && parseInt(customAnnounceVal, 10) > 0 && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  Preview Expiry: {new Date(Date.now() + (parseInt(customAnnounceVal, 10) || 1) * (customAnnounceUnit === 'minutes' ? 60000 : customAnnounceUnit === 'hours' ? 3600000 : customAnnounceUnit === 'days' ? 86400000 : 2592000000)).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            {/* Exact Date & Time Picker */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs border-t border-amber-100">
              <span className="text-slate-600 font-semibold">Or Pick Exact Date & Time:</span>
              <input
                type="datetime-local"
                value={toLocalDatetimeInputValue(formData.announcementExpiresAt)}
                onChange={(e) => {
                  if (e.target.value) {
                    const iso = fromLocalDatetimeInputValue(e.target.value);
                    if (iso) {
                      setFormData({ ...formData, announcementExpiresAt: iso, showBanner: true });
                      toast.success('Exact expiration time saved!', 'Timer Updated');
                    }
                  }
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-mono bg-white"
              />
              {formData.announcementExpiresAt && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, announcementExpiresAt: undefined })}
                  className="text-rose-600 text-xs font-bold hover:underline"
                >
                  Clear Expiry (Make Permanent)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* In-App Pop-Up Modal Broadcaster (लाइव पॉप-अप ब्रॉडकास्ट) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>In-App Pop-Up Modal Broadcaster (पॉप-अप ब्रॉडकास्टर)</span>
            </span>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                formData.popupBanner?.enabled
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {formData.popupBanner?.enabled ? '● Pop-Up Live' : '○ Disabled'}
              </span>
              <button
                type="button"
                onClick={async () => {
                  const newEnabled = !(formData.popupBanner?.enabled ?? false);
                  const updatedPopup = {
                    ...(formData.popupBanner || {
                      title: 'Special Live Announcement',
                      actionText: 'Explore Now',
                      actionUrl: 'tab:courses',
                    }),
                    enabled: newEnabled,
                  };
                  setFormData({ ...formData, popupBanner: updatedPopup });
                  try {
                    await updateAppSettings({ popupBanner: updatedPopup });
                    toast.success(
                      newEnabled ? 'Pop-up broadcast activated!' : 'Pop-up broadcast deactivated.'
                    );
                  } catch (e: any) {
                    toast.error('Failed to update: ' + e.message);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  formData.popupBanner?.enabled
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {formData.popupBanner?.enabled ? 'Active (ON)' : 'Turn ON'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-amber-900 leading-relaxed">
            छात्रों के ऐप खोलते ही स्क्रीन के बीच में दिखाई देने वाला आकर्षक घोषणा या ऑफर पॉप-अप (Title, Image, CTA Button)।
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-amber-950 mb-1">
                Top Badge (टैग / बैज):
              </label>
              <input
                type="text"
                value={formData.popupBanner?.badgeText || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popupBanner: {
                      ...(formData.popupBanner || {
                        enabled: false,
                        title: '',
                      }),
                      badgeText: e.target.value,
                    },
                  })
                }
                placeholder="e.g. 🎯 NEW BATCH LAUNCH, 50% OFF"
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-950 mb-1">
                Headline / Title (मुख्य शीर्षक):
              </label>
              <input
                type="text"
                value={formData.popupBanner?.title || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popupBanner: {
                      ...(formData.popupBanner || {
                        enabled: false,
                        title: '',
                      }),
                      title: e.target.value,
                    },
                  })
                }
                placeholder="e.g. All India Mock Test Series 2026 is Live!"
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-amber-950 mb-1">
                Description / Subtitle (विस्तृत सूचना):
              </label>
              <textarea
                rows={2}
                value={formData.popupBanner?.subtitle || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popupBanner: {
                      ...(formData.popupBanner || {
                        enabled: false,
                        title: '',
                      }),
                      subtitle: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Participate before Sunday 9 PM to get All India Rank and detailed video solutions."
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-950 mb-1">
                Action Button Text (बटन टेक्स्ट):
              </label>
              <input
                type="text"
                value={formData.popupBanner?.actionText || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popupBanner: {
                      ...(formData.popupBanner || {
                        enabled: false,
                        title: '',
                      }),
                      actionText: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Start Test Now, Enroll Today"
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-950 mb-1">
                Target Action / Destination (कहाँ ले जाएं):
              </label>
              <select
                value={formData.popupBanner?.actionUrl || 'tab:courses'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popupBanner: {
                      ...(formData.popupBanner || {
                        enabled: false,
                        title: '',
                      }),
                      actionUrl: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold"
              >
                <option value="tab:courses">Courses / Subjects (कोर्सेज)</option>
                <option value="tab:mocktests">Mock Test Series (टेस्ट सीरीज)</option>
                <option value="tab:downloads">Notes & Material (स्टडी नोट्स)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Maintenance Message */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Maintenance Notice Message (Shown to Students)
          </label>
          <textarea
            rows={2}
            value={formData.maintenanceMessage || ''}
            onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500"
          />
        </div>

        {/* ================= API KEYS & EXTERNAL INTEGRATIONS SECTION ================= */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-slate-50 to-blue-50/40 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  API Keys & Live External Integrations (एपीआई कीज़ एवं सेवाएं)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure real API keys for AI Doubt Solver, Video Streaming, and Payment Gateways.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Realtime Sync with User App
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Gemini API Key */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Google Gemini API Key</span>
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  formData.geminiApiKey?.trim() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {formData.geminiApiKey?.trim() ? 'Active / Configured' : 'Default Fallback'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Powers AI Doubt Solver, Chapter Summaries, and MCQ Explanations in the student app.
              </p>
              <div className="relative">
                <input
                  type={showApiKeys['gemini'] ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('gemini')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Groq LPU API Key */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                  <span>Groq LPU Fast Inference Key</span>
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  formData.groqApiKey?.trim() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {formData.groqApiKey?.trim() ? 'Active / Configured' : 'Optional'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                High-speed LPU fallback for instant 500+ tokens/sec doubt resolution.
              </p>
              <div className="relative">
                <input
                  type={showApiKeys['groq'] ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={formData.groqApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('groq')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKeys['groq'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* YouTube Data API Key */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-600" />
                  <span>YouTube Data API v3 Key</span>
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  formData.youtubeApiKey?.trim() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {formData.youtubeApiKey?.trim() ? 'Active / Configured' : 'Direct Embed Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Enables search and verified syllabus video streaming in the student player.
              </p>
              <div className="relative">
                <input
                  type={showApiKeys['youtube'] ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={formData.youtubeApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, youtubeApiKey: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('youtube')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKeys['youtube'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Razorpay Key ID */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Razorpay Key ID (Payment Gateway)</span>
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  formData.razorpayKeyId?.trim() ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {formData.razorpayKeyId?.trim() ? 'Gateway Live' : 'Test Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Used in student app for mock test series & course purchase checkout.
              </p>
              <div className="relative">
                <input
                  type={showApiKeys['razorpay'] ? 'text' : 'password'}
                  placeholder="rzp_live_... or rzp_test_..."
                  value={formData.razorpayKeyId || ''}
                  onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('razorpay')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKeys['razorpay'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Synchronizing with Firestore...' : 'Save App Settings (सेटिंग्स सहेजें)'}</span>
          </button>

          {saveSuccess && (
            <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated in Firestore!
            </span>
          )}
        </div>
      </form>

      {/* Danger Zone: Purge All Fake / Demo Data */}
      {isDeveloper && (
        <div className="p-6 bg-white rounded-3xl border border-rose-200 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
            <Trash2 className="w-5 h-5" />
            <span>Danger Zone: Purge All Demo & Educational Data (डेटाबेस साफ़ करें)</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Clicking this will permanently delete all mock subjects, chapters, video lectures, PDF notes, MCQs, and tests from your Firestore database, leaving you with a completely clean and fresh platform.
          </p>

          {purgeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{purgeSuccess}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handlePurgeAllData}
              disabled={isPurging}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-rose-200 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className={`w-4 h-4 ${isPurging ? 'animate-spin' : ''}`} />
              <span>{isPurging ? 'Purging Firestore Database...' : '🗑️ Remove All Fake Data from Firestore'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

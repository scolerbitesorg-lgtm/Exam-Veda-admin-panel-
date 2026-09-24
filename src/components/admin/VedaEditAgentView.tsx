import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Cpu,
  Palette,
  Shield,
  BookOpen,
  FolderTree,
  Bell,
  Sliders,
  Terminal,
  HelpCircle,
  FileText,
  Video,
  Award,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
} from 'lucide-react';
import { executeVedaEditCommand } from '../../services/vedaEditAgentService';
import { testAIProvider } from '../../services/aiProviderService';
import { updateAppSettings } from '../../services/dbService';
import type {
  Subject,
  Topic,
  AppSettings,
  AdminTab,
  VedaEditActionRecord,
  MultiAISettings,
} from '../../types';

interface VedaEditAgentViewProps {
  appSettings: AppSettings;
  subjects: Subject[];
  topics: Topic[];
  onNavigateTab: (tab: AdminTab) => void;
  onRefreshData?: () => void;
  onUpdatePassword?: (uid: string, newPass: string) => Promise<void>;
  onCreateTeamMember?: (
    name: string,
    email: string,
    pass: string,
    role: 'developer' | 'admin' | 'content_admin',
    mobile?: string
  ) => Promise<void>;
}

export const VedaEditAgentView: React.FC<VedaEditAgentViewProps> = ({
  appSettings,
  subjects,
  topics,
  onNavigateTab,
  onRefreshData,
  onUpdatePassword,
  onCreateTeamMember,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(
    appSettings.aiMultiProviders?.vedaEditCustomApiKey || ''
  );
  const [preferredProvider, setPreferredProvider] = useState<string>(
    appSettings.aiMultiProviders?.vedaEditProvider || 'auto'
  );
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [keySaving, setKeySaving] = useState(false);
  const [keySavedSuccess, setKeySavedSuccess] = useState(false);

  const [chatHistory, setChatHistory] = useState<
    Array<{
      id: string;
      role: 'user' | 'agent';
      text: string;
      actionRecord?: VedaEditActionRecord;
      providerUsed?: string;
      modelUsed?: string;
      timestamp: string;
    }>
  >([
    {
      id: 'welcome_1',
      role: 'agent',
      text: `👋 **नमस्ते Admin! मैं "Veda Edit" हूँ — आपका 24x7 ऑटोनॉमस एडमिन AI पार्टनर।**

मैं आपके पूरे एडमिन पैनल को समझता हूँ और आपकी बात सुनकर सीधे बदलाव कर सकता हूँ!

**मैं आपके लिए क्या-क्या कर सकता हूँ?**
1. 🎯 **Mock Tests & Quizzes**: *"Upload mock test on Indian History with 20 questions"*
2. 📝 **Study Notes & PDFs**: *"Create revision note on Indian Polity"*
3. 🎥 **Video Lectures**: *"Add lecture on Indian Constitution"*
4. 📚 **Subjects & Chapters**: *"Add subject Environmental Science"*
5. 🎨 **Branding & Theme**: *"Theme color Emerald green kar do"*
6. 📖 **A to Z Admin Help**: *"Admin panel ki A2Z jankari do"*

नीचे दिए गए किसी भी बटन पर क्लिक करें या सीधे हिंदी / English में लिखें!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      providerUsed: 'Veda Edit Master Partner',
      modelUsed: 'Autonomous Admin AI',
    },
  ]);

  const [recentActions, setRecentActions] = useState<VedaEditActionRecord[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const multiSettings: MultiAISettings = appSettings.aiMultiProviders || {
    enableAutoFailover: true,
    activeOrder: ['gemini', 'openai', 'groq'],
  };

  const activeProviderCount = [
    multiSettings.gemini?.enabled && multiSettings.gemini?.apiKey,
    multiSettings.openai?.enabled && multiSettings.openai?.apiKey,
    multiSettings.groq?.enabled && multiSettings.groq?.apiKey,
    multiSettings.anthropic?.enabled && multiSettings.anthropic?.apiKey,
  ].filter(Boolean).length;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isExecuting]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const targetCommand = (cmdToRun || commandInput).trim();
    if (!targetCommand || isExecuting) return;

    const userMsgId = 'msg_' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatHistory((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        text: targetCommand,
        timestamp: timeStr,
      },
    ]);

    setCommandInput('');
    setIsExecuting(true);

    try {
      const res = await executeVedaEditCommand({
        command: targetCommand,
        appSettings,
        multiSettings,
        subjects,
        topics,
        onUpdatePassword,
        onCreateTeamMember,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          id: 'agent_' + Date.now(),
          role: 'agent',
          text: res.reply,
          actionRecord: res.actionRecord,
          providerUsed: res.providerUsed,
          modelUsed: res.modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (res.actionRecord) {
        setRecentActions((prev) => [res.actionRecord, ...prev.slice(0, 9)]);
      }

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'agent',
          text: `⚠️ **त्रुटि (Error):** ${err.message || 'कमांड निष्पादित करने में असमर्थ।'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          providerUsed: 'Veda Edit Engine',
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTestVedaEditKey = async () => {
    const key = customKeyInput.trim().replace(/^["']|["']$/g, '');
    if (!key) {
      setKeyTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }
    setKeyTesting(true);
    setKeyTestResult(null);
    try {
      const res = await testAIProvider(preferredProvider as any, key);
      setKeyTestResult(res);
    } catch (err: any) {
      setKeyTestResult({ success: false, message: err.message });
    } finally {
      setKeyTesting(false);
    }
  };

  const handleSaveVedaEditApiKey = async () => {
    setKeySaving(true);
    try {
      const cleanKey = customKeyInput.trim().replace(/^["']|["']$/g, '');
      
      let detectedProv = preferredProvider;
      if (cleanKey.startsWith('AIzaSy')) detectedProv = 'gemini';
      else if (cleanKey.startsWith('gsk_')) detectedProv = 'groq';
      else if (cleanKey.startsWith('sk-ant-')) detectedProv = 'anthropic';
      else if (cleanKey.startsWith('sk-')) detectedProv = 'openai';

      const updatedMulti: MultiAISettings = {
        ...multiSettings,
        vedaEditCustomApiKey: cleanKey,
        vedaEditProvider: preferredProvider as any,
      };

      // Also ensure the respective provider config is updated
      if (detectedProv === 'gemini' && updatedMulti.gemini) {
        updatedMulti.gemini = { ...updatedMulti.gemini, apiKey: cleanKey, enabled: true };
      } else if (detectedProv === 'groq' && updatedMulti.groq) {
        updatedMulti.groq = { ...updatedMulti.groq, apiKey: cleanKey, enabled: true };
      } else if (detectedProv === 'openai' && updatedMulti.openai) {
        updatedMulti.openai = { ...updatedMulti.openai, apiKey: cleanKey, enabled: true };
      } else if (detectedProv === 'anthropic' && updatedMulti.anthropic) {
        updatedMulti.anthropic = { ...updatedMulti.anthropic, apiKey: cleanKey, enabled: true };
      }

      await updateAppSettings({
        aiMultiProviders: updatedMulti,
      });
      setKeySavedSuccess(true);
      setTimeout(() => {
        setKeySavedSuccess(false);
        setIsApiKeyModalOpen(false);
      }, 1500);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Error saving API Key: ' + err.message);
    } finally {
      setKeySaving(false);
    }
  };

  const quickPrompts = [
    { label: '📖 A to Z Admin Guide (पूरा गाइड)', cmd: 'Admin panel ki A2Z jankari do aur sabhi features samjhao' },
    { label: '🎯 Upload Mock Test on History', cmd: 'Upload mock test on Indian History with 10 questions' },
    { label: '📝 Create Study Note on Polity', cmd: 'Create revision note on Indian Polity Constitutional Framework' },
    { label: '🎥 Add Video Lecture', cmd: 'Add lecture on Geography Rivers of India' },
    { label: '🎨 Change Theme to Emerald Green', cmd: 'Theme color Emerald Green kar do' },
    { label: '📢 Update Notice Banner', cmd: 'Notice banner update karo: 🎉 New Foundation Batches Live on Mobile App!' },
    { label: '📊 System Health Audit', cmd: 'System summary report aur counts dikhao' },
    { label: '⚠️ Toggle Maintenance Mode', cmd: 'Maintenance mode on kar do' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-AI Failover Status */}
      <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white border border-indigo-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Zap className="w-8 h-8 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">Veda Edit (वेदा एडिट)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                  Human-like Admin Partner
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  A to Z Controller Ready
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                बोलकर या लिखकर मॉक टेस्ट्स, नोट्स, लेक्चर्स अपलोड करवाएं, थीम व सेटिंग्स बदलें और एडमिन पैनल की A2Z जानकारी प्राप्त करें।
              </p>
            </div>
          </div>

          {/* Quick API Key Setup button */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>🔑 Configure Veda Edit API Key</span>
            </button>

            <div className="bg-slate-950/70 border border-indigo-700/50 rounded-2xl p-2.5 text-xs text-center">
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {activeProviderCount > 0 ? `${activeProviderCount} AI Connected` : 'Direct Engine Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div className="mt-5 pt-4 border-t border-indigo-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-amber-300 uppercase shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Actions:
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRunCommand(q.cmd)}
              disabled={isExecuting}
              className="px-3 py-1.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-800 text-indigo-100 hover:text-white text-xs font-semibold border border-indigo-700/60 transition shrink-0 hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* VEDA EDIT API KEY MODAL */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Veda Edit API Key Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add or update your AI Key for autonomous agent actions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {keySavedSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-slate-900 text-sm">API Key Saved in Firestore!</h4>
                <p className="text-xs text-slate-500">Veda Edit is now synchronized and ready.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select AI Provider Engine</label>
                  <select
                    value={preferredProvider}
                    onChange={(e) => setPreferredProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="auto">⚡ Auto Failover (Gemini ➔ OpenAI ➔ Groq)</option>
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="openai">OpenAI ChatGPT (GPT-4o Mini)</option>
                    <option value="groq">Groq Cloud (Llama 3.3 70B Ultra Fast)</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    API Key (Gemini, OpenAI, or Groq):
                  </label>
                  <div className="relative">
                    <input
                      type={showKeySecret ? 'text' : 'password'}
                      value={customKeyInput}
                      onChange={(e) => setCustomKeyInput(e.target.value)}
                      placeholder="Paste your API key here..."
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1 font-bold cursor-pointer"
                    >
                      {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {keyTestResult && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                      keyTestResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {keyTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="truncate">{keyTestResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleTestVedaEditKey}
                    disabled={keyTesting}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {keyTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{keyTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsApiKeyModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVedaEditApiKey}
                      disabled={keySaving}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{keySaving ? 'Saving...' : 'Save API Key'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Agent Chat & Live Action Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Conversational Console */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col h-[650px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-extrabold text-slate-900 text-sm">
                Veda Edit Natural Language Terminal
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setChatHistory([
                    {
                      id: 'welcome_' + Date.now(),
                      role: 'agent',
                      text: 'Terminal reset. Veda Edit ready for next command.',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      providerUsed: 'Veda Edit Engine',
                    },
                  ])
                }
                className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Clear Screen
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {chatHistory.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {isUser ? 'You (Admin)' : '🤖 Veda Edit'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    {msg.providerUsed && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {msg.providerUsed}
                      </span>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs max-w-2xl leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none space-y-2'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                    {/* Action Execution Card */}
                    {msg.actionRecord && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-[11px] block">{msg.actionRecord.title}</span>
                            <span className="text-[10px] text-slate-500">{msg.actionRecord.details}</span>
                          </div>
                        </div>
                        {msg.actionRecord.targetTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab(msg.actionRecord!.targetTab!)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-indigo-700 transition shrink-0 cursor-pointer"
                          >
                            <span>Open Tab</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isExecuting && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-indigo-100 w-fit text-xs text-indigo-600 font-bold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Veda Edit is understanding command & modifying database...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Input Box */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask anything or command Veda Edit: 'Upload mock test with 15 questions', 'Add note on Rivers'..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                disabled={isExecuting}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={isExecuting || !commandInput.trim()}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Quick Shortcuts & Features Card */}
        <div className="space-y-5">
          {/* Quick Tab Jump Shortcuts */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-indigo-600" />
              <span>Admin Feature Shortcuts</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('subjects')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>📚 Subjects</span>
              </button>
              <button
                onClick={() => onNavigateTab('topics')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>📂 Topics</span>
              </button>
              <button
                onClick={() => onNavigateTab('lectures')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>🎥 Video Lectures</span>
              </button>
              <button
                onClick={() => onNavigateTab('notes')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>📝 Notes & PDFs</span>
              </button>
              <button
                onClick={() => onNavigateTab('mcqs')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>❓ MCQs Bank</span>
              </button>
              <button
                onClick={() => onNavigateTab('mocktests')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>⏱️ Mock Tests</span>
              </button>
              <button
                onClick={() => onNavigateTab('users')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>👥 Users & Pass</span>
              </button>
              <button
                onClick={() => onNavigateTab('settings')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <span>⚙️ Settings & Logo</span>
              </button>
            </div>
          </div>

          {/* Recent Agent Modifications */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Recent AI Actions ({recentActions.length})</span>
            </h3>

            {recentActions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Give any command to Veda Edit. Recorded actions will appear here in real-time.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[160px]">{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.targetTab && (
                      <button
                        onClick={() => onNavigateTab(act.targetTab!)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        View ➔
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

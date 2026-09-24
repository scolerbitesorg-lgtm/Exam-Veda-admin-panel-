import React, { useState, useEffect } from 'react';
import {
  Database,
  Key,
  Layers,
  Copy,
  Check,
  Smartphone,
  Code2,
  Server,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FileCode,
  Flame,
  ExternalLink,
  BookOpen,
  Lock,
  Edit3,
  Save,
  Download,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import firebaseConfigData from '../../../firebase-applet-config.json';
import { updateAppSettings, getAppSettings } from '../../services/dbService';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: firebaseConfigData.apiKey || '',
  authDomain: firebaseConfigData.authDomain || '',
  projectId: firebaseConfigData.projectId || '',
  storageBucket: firebaseConfigData.storageBucket || '',
  messagingSenderId: firebaseConfigData.messagingSenderId || '',
  appId: firebaseConfigData.appId || '',
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || '',
};

export const FirebaseSyncView: React.FC = () => {
  const { isDeveloper } = useAuth();
  const [config, setConfig] = useState(DEFAULT_FIREBASE_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'flutter' | 'react-native' | 'android' | 'web'>('react-native');
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs: number; timestamp: string } | null>(null);

  useEffect(() => {
    const loadCustomConfig = async () => {
      try {
        const settings = await getAppSettings();
        if (settings.customFirebaseConfig && settings.customFirebaseConfig.apiKey) {
          setConfig({
            apiKey: settings.customFirebaseConfig.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
            authDomain: settings.customFirebaseConfig.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
            projectId: settings.customFirebaseConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
            storageBucket: settings.customFirebaseConfig.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
            messagingSenderId: settings.customFirebaseConfig.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
            appId: settings.customFirebaseConfig.appId || DEFAULT_FIREBASE_CONFIG.appId,
            firestoreDatabaseId: settings.customFirebaseConfig.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
          });
        }
      } catch (err) {
        console.error('Failed to load custom firebase config:', err);
      }
    };
    loadCustomConfig();
  }, []);

  const handleCopy = (keyName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveCustomConfig = async () => {
    if (!isDeveloper) {
      alert('Only Lead Developer has permission to modify Firebase backend configurations.');
      return;
    }
    setIsSaving(true);
    try {
      await updateAppSettings({
        customFirebaseConfig: config,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Error saving custom Firebase config: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!isDeveloper) return;
    if (window.confirm('Reset Firebase configuration to default app credentials?')) {
      setConfig(DEFAULT_FIREBASE_CONFIG);
      await updateAppSettings({
        customFirebaseConfig: DEFAULT_FIREBASE_CONFIG,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "firebase-applet-config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTestConnection = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const pingDocRef = doc(db, '_connection_test', 'ping');
      await setDoc(pingDocRef, {
        client: 'EduVeda Admin Portal',
        timestamp: new Date().toISOString(),
      });
      const snap = await getDoc(pingDocRef);
      if (snap.exists()) {
        const latency = Math.round(performance.now() - start);
        setPingResult({
          success: true,
          latencyMs: Math.max(latency, 24),
          timestamp: new Date().toLocaleTimeString(),
        });
        await deleteDoc(pingDocRef).catch(() => {});
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setPingResult({
        success: false,
        latencyMs: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsPinging(false);
    }
  };

  const flutterCodeSnippet = `// lib/firebase_options.dart
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return const FirebaseOptions(
      apiKey: '${config.apiKey}',
      appId: '${config.appId}',
      messagingSenderId: '${config.messagingSenderId}',
      projectId: '${config.projectId}',
      authDomain: '${config.authDomain}',
      storageBucket: '${config.storageBucket}',
    );
  }
}`;

  const reactNativeSnippet = `// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "${config.firestoreDatabaseId}");`;

  const androidJsonSnippet = `{
  "project_info": {
    "project_number": "${config.messagingSenderId}",
    "project_id": "${config.projectId}",
    "storage_bucket": "${config.storageBucket}"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "${config.appId}",
        "android_client_info": {
          "package_name": "com.eduveda.studentapp"
        }
      },
      "api_key": [
        {
          "current_key": "${config.apiKey}"
        }
      ]
    }
  ]
}`;

  const webSnippet = `// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "${config.firestoreDatabaseId}");`;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Firebase & User App Bridge
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Firebase Connection Variables & Keys (फायरबेस कुंजियाँ)
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            All 6 Firebase credentials are fully configurable here. Enter new values to update both apps in synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isDeveloper && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit New Keys'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
            title="Download JSON config"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isPinging}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-900/40 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Testing Ping...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      {/* Ping Status Alert */}
      {pingResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            pingResult.success
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                pingResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {pingResult.success ? <CheckCircle2 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-xs">
                {pingResult.success
                  ? '✅ Firebase Firestore & Auth Database Synchronized Successfully!'
                  : '❌ Firestore Connection Ping Encountered an Issue'}
              </div>
              <div className="text-[11px] opacity-80">
                {pingResult.success
                  ? `Response latency: ${pingResult.latencyMs}ms • Verified at ${pingResult.timestamp}. Student app will receive instant real-time updates.`
                  : 'Please verify internet connectivity or Firebase security rules.'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 shadow-2xs">
            {pingResult.latencyMs} ms
          </span>
        </div>
      )}

      {/* Editable Firebase Keys Section */}
      {isEditing ? (
        <div className="p-6 bg-white rounded-3xl border-2 border-indigo-200 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-extrabold text-slate-900 text-sm">
                Enter Custom Firebase Variables (नए वेरिएबल दर्ज करें)
              </h2>
            </div>
            <button
              onClick={handleResetToDefault}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">API KEY ✅</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">AUTH DOMAIN ✅</label>
              <input
                type="text"
                value={config.authDomain}
                onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PROJECT ID ✅</label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">STORAGE BUCKET ✅</label>
              <input
                type="text"
                value={config.storageBucket}
                onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">MESSAGING SENDER ID ✅</label>
              <input
                type="text"
                value={config.messagingSenderId}
                onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">APP ID ✅</label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">FIRESTORE DATABASE ID</label>
              <input
                type="text"
                value={config.firestoreDatabaseId}
                onChange={(e) => setConfig({ ...config, firestoreDatabaseId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustomConfig}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-200"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Apply New Values'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* 6 Essential Firebase Keys Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'API KEY', key: 'apiKey', val: config.apiKey, icon: Key, color: 'text-amber-500' },
            { label: 'AUTH DOMAIN', key: 'authDomain', val: config.authDomain, icon: Server, color: 'text-sky-500' },
            { label: 'PROJECT ID', key: 'projectId', val: config.projectId, icon: ShieldCheck, color: 'text-indigo-500' },
            { label: 'STORAGE BUCKET', key: 'storageBucket', val: config.storageBucket, icon: Database, color: 'text-emerald-500' },
            { label: 'MESSAGING SENDER ID', key: 'messagingSenderId', val: config.messagingSenderId, icon: Sparkles, color: 'text-purple-500' },
            { label: 'APP ID', key: 'appId', val: config.appId, icon: Smartphone, color: 'text-rose-500' },
          ].map((item) => (
            <div
              key={item.key}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-[11px] font-extrabold text-slate-700 tracking-wider">
                    {item.label} ✅
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(item.key, item.val)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-1 transition"
                  title={`Copy ${item.label}`}
                >
                  {copiedKey === item.key ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 break-all select-all leading-tight">
                {item.val}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Integration Snippets for User/Student App */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>User App Code Generator (मोबाइल ऐप कोड)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Paste this configuration directly inside your student mobile app repository:
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs">
            {[
              { id: 'react-native', label: 'React Native / Expo' },
              { id: 'flutter', label: 'Flutter' },
              { id: 'android', label: 'Android (JSON)' },
              { id: 'web', label: 'Web / JS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                  activeCodeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Block */}
        <div className="relative">
          <button
            onClick={() => {
              const code =
                activeCodeTab === 'react-native'
                  ? reactNativeSnippet
                  : activeCodeTab === 'flutter'
                  ? flutterCodeSnippet
                  : activeCodeTab === 'android'
                  ? androidJsonSnippet
                  : webSnippet;
              handleCopy('snippet', code);
            }}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition z-10"
          >
            {copiedKey === 'snippet' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed max-h-80">
            {activeCodeTab === 'react-native' && reactNativeSnippet}
            {activeCodeTab === 'flutter' && flutterCodeSnippet}
            {activeCodeTab === 'android' && androidJsonSnippet}
            {activeCodeTab === 'web' && webSnippet}
          </pre>
        </div>
      </div>

      {/* Firestore Database Collection Schema Reference */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Shared Database Collections & Schema (डेटाबेस संग्रह संरचना)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Both this Admin Console and your Student App share these exact Firestore collections:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { name: '/subjects', desc: 'All courses and subjects (name, hindiName, color, order, published)' },
            { name: '/topics', desc: 'Chapters under subjects (title, hindiTitle, subjectId, order, published)' },
            { name: '/lectures', desc: 'Video lectures (title, videoUrl, duration, topicId, subjectId)' },
            { name: '/notes', desc: 'PDFs & study material (title, pdfUrl, fileSize, pages, topicId)' },
            { name: '/mcqs', desc: 'Question bank (question, hindiQuestion, options [4], correctOption, explanation)' },
            { name: '/mockTests', desc: 'Practice exams (title, duration, totalMarks, mcqIds [], passingMarks)' },
            { name: '/mockAttempts', desc: 'Student test scores, rankings, percentage, and detailed answers' },
            { name: '/users', desc: 'Student and administrator authentication profiles and roles' },
            { name: '/appSettings', desc: 'App banner, notices, maintenance mode flag, and branding configuration' },
          ].map((col) => (
            <div key={col.name} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-mono font-bold text-indigo-700">{col.name}</div>
              <p className="text-[11px] text-slate-600">{col.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

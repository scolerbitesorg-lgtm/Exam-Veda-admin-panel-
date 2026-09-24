import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  ShieldCheck,
  Database,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Save,
  Download,
  RotateCcw,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Server,
  Flame,
  FileCode,
} from 'lucide-react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, currentDatabaseId } from '../../firebase/config';
import firebaseConfigData from '../../../firebase-applet-config.json';
import { updateAppSettings, getAppSettings } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import type { AppSettings } from '../../types';

interface FirebaseSecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings?: AppSettings;
  onSettingsUpdated?: (updated: AppSettings) => void;
}

export const FirebaseSecretsModal: React.FC<FirebaseSecretsModalProps> = ({
  isOpen,
  onClose,
  appSettings,
  onSettingsUpdated,
}) => {
  const { isDeveloper, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'credentials' | 'security' | 'service_account' | 'snippets'>('credentials');

  // Secrets & Config state
  const [secrets, setSecrets] = useState({
    apiKey: firebaseConfigData.apiKey || '',
    projectId: firebaseConfigData.projectId || '',
    firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || '',
    authDomain: firebaseConfigData.authDomain || '',
    storageBucket: firebaseConfigData.storageBucket || '',
    messagingSenderId: firebaseConfigData.messagingSenderId || '',
    appId: firebaseConfigData.appId || '',
    measurementId: firebaseConfigData.measurementId || '',
    oAuthClientId: firebaseConfigData.oAuthClientId || '',
    oAuthClientSecret: '',
    recaptchaSiteKey: firebaseConfigData.recaptchaSiteKey || '',
    adminApiKey: '',
    serviceAccountKeyJson: '',
  });

  // UI state
  const [showMasked, setShowMasked] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string; timestamp: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [jsonValidationResult, setJsonValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Initialize from appSettings or config data
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const settings = appSettings || (await getAppSettings());
        const custom = settings.customFirebaseConfig || {};
        const adminSec = settings.adminFirebaseSecrets || {};

        setSecrets({
          apiKey: custom.apiKey || adminSec.apiKey || firebaseConfigData.apiKey || '',
          projectId: custom.projectId || adminSec.projectId || firebaseConfigData.projectId || '',
          firestoreDatabaseId:
            custom.firestoreDatabaseId || adminSec.firestoreDatabaseId || firebaseConfigData.firestoreDatabaseId || '',
          authDomain: custom.authDomain || adminSec.authDomain || firebaseConfigData.authDomain || '',
          storageBucket: custom.storageBucket || adminSec.storageBucket || firebaseConfigData.storageBucket || '',
          messagingSenderId:
            custom.messagingSenderId || adminSec.messagingSenderId || firebaseConfigData.messagingSenderId || '',
          appId: custom.appId || adminSec.appId || firebaseConfigData.appId || '',
          measurementId: custom.measurementId || firebaseConfigData.measurementId || '',
          oAuthClientId:
            custom.oAuthClientId || adminSec.oAuthClientId || firebaseConfigData.oAuthClientId || '',
          oAuthClientSecret: custom.oAuthClientSecret || adminSec.oAuthClientSecret || '',
          recaptchaSiteKey:
            custom.recaptchaSiteKey || adminSec.recaptchaSiteKey || firebaseConfigData.recaptchaSiteKey || '',
          adminApiKey: custom.adminApiKey || '',
          serviceAccountKeyJson: custom.serviceAccountKeyJson || adminSec.serviceAccountKeyJson || '',
        });
      } catch (err) {
        console.warn('Error fetching custom Firebase secrets:', err);
      }
    };

    loadData();
  }, [isOpen, appSettings]);

  if (!isOpen) return null;

  const toggleMask = (fieldName: string) => {
    setShowMasked((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleCopy = (field: string, val: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const pingDocRef = doc(db, '_connection_test', 'admin_secret_check');
      await setDoc(pingDocRef, {
        checkedBy: currentUser?.email || 'admin',
        timestamp: new Date().toISOString(),
        databaseId: currentDatabaseId,
      });
      const snap = await getDoc(pingDocRef);
      if (snap.exists()) {
        const latency = Math.round(performance.now() - start);
        setTestResult({
          success: true,
          latencyMs: Math.max(latency, 28),
          message: 'Connection verified! Read & Write permissions active.',
          timestamp: new Date().toLocaleTimeString(),
        });
        await deleteDoc(pingDocRef).catch(() => {});
      } else {
        throw new Error('Verification document not found');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err.message || 'Connection test failed',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleValidateServiceAccountJson = () => {
    if (!secrets.serviceAccountKeyJson.trim()) {
      setJsonValidationResult({ valid: false, message: 'Please enter Service Account JSON first.' });
      return;
    }
    try {
      const parsed = JSON.parse(secrets.serviceAccountKeyJson);
      if (parsed.type === 'service_account' && parsed.project_id && parsed.private_key) {
        setJsonValidationResult({
          valid: true,
          message: `Valid service account key for project: "${parsed.project_id}" (${parsed.client_email || 'Verified'})`,
        });
      } else {
        setJsonValidationResult({
          valid: false,
          message: 'JSON parsed but missing standard fields: "type": "service_account", "project_id", or "private_key".',
        });
      }
    } catch (e: any) {
      setJsonValidationResult({
        valid: false,
        message: 'Invalid JSON syntax: ' + e.message,
      });
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all credentials to active applet workspace settings?')) {
      setSecrets({
        apiKey: firebaseConfigData.apiKey || '',
        projectId: firebaseConfigData.projectId || '',
        firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || '',
        authDomain: firebaseConfigData.authDomain || '',
        storageBucket: firebaseConfigData.storageBucket || '',
        messagingSenderId: firebaseConfigData.messagingSenderId || '',
        appId: firebaseConfigData.appId || '',
        measurementId: firebaseConfigData.measurementId || '',
        oAuthClientId: firebaseConfigData.oAuthClientId || '',
        oAuthClientSecret: '',
        recaptchaSiteKey: firebaseConfigData.recaptchaSiteKey || '',
        adminApiKey: '',
        serviceAccountKeyJson: '',
      });
      setSaveFeedback('Restored active workspace defaults. Click Save to persist.');
      setTimeout(() => setSaveFeedback(null), 4000);
    }
  };

  const handleSaveSecrets = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const customConfig = {
        apiKey: secrets.apiKey.trim(),
        projectId: secrets.projectId.trim(),
        firestoreDatabaseId: secrets.firestoreDatabaseId.trim(),
        authDomain: secrets.authDomain.trim(),
        storageBucket: secrets.storageBucket.trim(),
        messagingSenderId: secrets.messagingSenderId.trim(),
        appId: secrets.appId.trim(),
        measurementId: secrets.measurementId.trim(),
        oAuthClientId: secrets.oAuthClientId.trim(),
        oAuthClientSecret: secrets.oAuthClientSecret.trim(),
        recaptchaSiteKey: secrets.recaptchaSiteKey.trim(),
        adminApiKey: secrets.adminApiKey.trim(),
        serviceAccountKeyJson: secrets.serviceAccountKeyJson.trim(),
      };

      const adminSecrets = {
        apiKey: secrets.apiKey.trim(),
        projectId: secrets.projectId.trim(),
        firestoreDatabaseId: secrets.firestoreDatabaseId.trim(),
        authDomain: secrets.authDomain.trim(),
        storageBucket: secrets.storageBucket.trim(),
        messagingSenderId: secrets.messagingSenderId.trim(),
        appId: secrets.appId.trim(),
        oAuthClientId: secrets.oAuthClientId.trim(),
        oAuthClientSecret: secrets.oAuthClientSecret.trim(),
        recaptchaSiteKey: secrets.recaptchaSiteKey.trim(),
        serviceAccountKeyJson: secrets.serviceAccountKeyJson.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
      };

      await updateAppSettings({
        customFirebaseConfig: customConfig,
        adminFirebaseSecrets: adminSecrets,
      });

      if (onSettingsUpdated && appSettings) {
        onSettingsUpdated({
          ...appSettings,
          customFirebaseConfig: customConfig,
          adminFirebaseSecrets: adminSecrets,
        });
      }

      setSaveFeedback('Firebase secrets & configuration saved successfully to Firestore!');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (err: any) {
      alert('Error saving Firebase secrets: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadConfigJson = () => {
    const exportConfig = {
      projectId: secrets.projectId,
      appId: secrets.appId,
      apiKey: secrets.apiKey,
      authDomain: secrets.authDomain,
      firestoreDatabaseId: secrets.firestoreDatabaseId,
      storageBucket: secrets.storageBucket,
      messagingSenderId: secrets.messagingSenderId,
      measurementId: secrets.measurementId,
      oAuthClientId: secrets.oAuthClientId,
      recaptchaSiteKey: secrets.recaptchaSiteKey,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportConfig, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'firebase-applet-config.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white">Firebase Secrets & Admin Credentials</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live Firestore
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Manage Web API keys, Firestore database credentials, Google OAuth, and Service Account tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Project:</span>
              <code className="font-mono text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                {secrets.projectId || 'Not set'}
              </code>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 font-medium text-slate-700">
              <span>Database:</span>
              <code className="font-mono text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {secrets.firestoreDatabaseId || '(default)'}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isTesting ? 'Pinging Firestore...' : 'Test Connection'}</span>
            </button>
            <button
              onClick={handleDownloadConfigJson}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
              title="Download firebase-applet-config.json"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          </div>
        </div>

        {/* Live Test Feedback if triggered */}
        {testResult && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                <strong>{testResult.success ? 'Success' : 'Error'}:</strong> {testResult.message}
                {testResult.success && ` (Roundtrip Latency: ${testResult.latencyMs}ms)`}
              </span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">{testResult.timestamp}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-2 pt-2 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Firebase App Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>OAuth & Security Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('service_account')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'service_account'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Service Account JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('snippets')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'snippets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Client SDK Snippets (.env)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Main App Credentials */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Web Client & Firestore Connection Configuration</p>
                  <p className="text-indigo-800/80 text-[11px] mt-0.5">
                    These credentials configure client communication with Firebase Auth, Firestore, and Cloud Storage for both this Admin Portal and the Student Mobile App.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Firebase API Key */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      Firebase Web API Key (apiKey)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Sensitive Secret</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showMasked.apiKey ? 'text' : 'password'}
                      value={secrets.apiKey}
                      onChange={(e) => setSecrets({ ...secrets, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono bg-slate-50/50"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleMask('apiKey')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                        title={showMasked.apiKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showMasked.apiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy('apiKey', secrets.apiKey)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50"
                        title="Copy Key"
                      >
                        {copiedField === 'apiKey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Project ID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Project ID (projectId)</span>
                    {secrets.projectId && (
                      <button
                        type="button"
                        onClick={() => handleCopy('projectId', secrets.projectId)}
                        className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {copiedField === 'projectId' ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={secrets.projectId}
                    onChange={(e) => setSecrets({ ...secrets, projectId: e.target.value })}
                    placeholder="e.g. acoustic-energy-65p7n"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* Firestore Database ID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Firestore Database ID</span>
                    <span className="text-[10px] text-slate-400 font-mono">Named or (default)</span>
                  </label>
                  <input
                    type="text"
                    value={secrets.firestoreDatabaseId}
                    onChange={(e) => setSecrets({ ...secrets, firestoreDatabaseId: e.target.value })}
                    placeholder="e.g. ai-studio-remixuntitled-..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* Auth Domain */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Auth Domain (authDomain)</label>
                  <input
                    type="text"
                    value={secrets.authDomain}
                    onChange={(e) => setSecrets({ ...secrets, authDomain: e.target.value })}
                    placeholder="project-id.firebaseapp.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* Storage Bucket */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Storage Bucket (storageBucket)</label>
                  <input
                    type="text"
                    value={secrets.storageBucket}
                    onChange={(e) => setSecrets({ ...secrets, storageBucket: e.target.value })}
                    placeholder="project-id.firebasestorage.app"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* Messaging Sender ID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">FCM Messaging Sender ID</label>
                  <input
                    type="text"
                    value={secrets.messagingSenderId}
                    onChange={(e) => setSecrets({ ...secrets, messagingSenderId: e.target.value })}
                    placeholder="e.g. 577865334119"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* App ID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Web App ID (appId)</label>
                  <input
                    type="text"
                    value={secrets.appId}
                    onChange={(e) => setSecrets({ ...secrets, appId: e.target.value })}
                    placeholder="1:577865334119:web:3d8772a6..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OAuth & Security Keys */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3 text-xs text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">OAuth 2.0 Client & Security Tokens</p>
                  <p className="text-amber-800/80 text-[11px] mt-0.5">
                    Used for Google Sign-In, Firebase App Check, and privileged admin actions. Keep OAuth client secrets confidential.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Google OAuth Client ID */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Google OAuth Web Client ID (oAuthClientId)</span>
                    {secrets.oAuthClientId && (
                      <button
                        type="button"
                        onClick={() => handleCopy('oAuthClientId', secrets.oAuthClientId)}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        {copiedField === 'oAuthClientId' ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={secrets.oAuthClientId}
                    onChange={(e) => setSecrets({ ...secrets, oAuthClientId: e.target.value })}
                    placeholder="577865334119-...apps.googleusercontent.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* Google OAuth Client Secret */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Google OAuth Client Secret (oAuthClientSecret)</span>
                    <span className="text-[10px] text-rose-500 font-semibold">Keep Secret</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showMasked.oAuthClientSecret ? 'text' : 'password'}
                      value={secrets.oAuthClientSecret}
                      onChange={(e) => setSecrets({ ...secrets, oAuthClientSecret: e.target.value })}
                      placeholder="GOCSPX-..."
                      className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono bg-slate-50/50"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleMask('oAuthClientSecret')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                        title="Toggle visibility"
                      >
                        {showMasked.oAuthClientSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy('oAuthClientSecret', secrets.oAuthClientSecret)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                        title="Copy"
                      >
                        {copiedField === 'oAuthClientSecret' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* reCAPTCHA / App Check Site Key */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>reCAPTCHA / App Check Site Key</span>
                    <span className="text-[10px] text-slate-400 font-mono">Client-side Public Key</span>
                  </label>
                  <input
                    type="text"
                    value={secrets.recaptchaSiteKey}
                    onChange={(e) => setSecrets({ ...secrets, recaptchaSiteKey: e.target.value })}
                    placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono"
                  />
                </div>

                {/* Admin Master API Key / Custom Token */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Edu Veda Admin Master API Key</span>
                    <span className="text-[10px] text-slate-400 font-mono">Optional Backend Gateway</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showMasked.adminApiKey ? 'text' : 'password'}
                      value={secrets.adminApiKey}
                      onChange={(e) => setSecrets({ ...secrets, adminApiKey: e.target.value })}
                      placeholder="eduveda-admin-sec-..."
                      className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono bg-slate-50/50"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleMask('adminApiKey')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        {showMasked.adminApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy('adminApiKey', secrets.adminApiKey)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                      >
                        {copiedField === 'adminApiKey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Service Account Private Key */}
          {activeTab === 'service_account' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-start gap-3 text-xs">
                <Server className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-300">Firebase Admin SDK Service Account Private Key</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    If running server-side automations, bulk user imports, or cloud workers, paste your Google Cloud Service Account JSON key below.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-slate-700">Service Account Key JSON</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleValidateServiceAccountJson}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 border border-indigo-200 transition"
                    >
                      Validate JSON
                    </button>
                    {secrets.serviceAccountKeyJson && (
                      <button
                        type="button"
                        onClick={() => handleCopy('serviceAccountKeyJson', secrets.serviceAccountKeyJson)}
                        className="text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        {copiedField === 'serviceAccountKeyJson' ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={secrets.serviceAccountKeyJson}
                  onChange={(e) => {
                    setSecrets({ ...secrets, serviceAccountKeyJson: e.target.value });
                    setJsonValidationResult(null);
                  }}
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "${secrets.projectId || 'your-project'}",\n  "private_key_id": "...",\n  "private_key": "YOUR_PRIVATE_KEY_HERE",\n  "client_email": "firebase-adminsdk-...@${secrets.projectId || 'project'}.iam.gserviceaccount.com"\n}`}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 font-mono text-[11px] bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-hidden"
                />

                {jsonValidationResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      jsonValidationResult.valid
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {jsonValidationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{jsonValidationResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Environment & Snippets */}
          {activeTab === 'snippets' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
                <Code2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Environment Variables & Mobile App Config</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Copy and paste these snippets directly into your development `.env` or remote mobile client builds.
                  </p>
                </div>
              </div>

              {/* .env snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 font-mono">.env.production / .env.local</span>
                  <button
                    onClick={() => {
                      const envText = `VITE_FIREBASE_API_KEY="${secrets.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${secrets.authDomain}"
VITE_FIREBASE_PROJECT_ID="${secrets.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${secrets.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${secrets.messagingSenderId}"
VITE_FIREBASE_APP_ID="${secrets.appId}"
VITE_FIREBASE_DATABASE_ID="${secrets.firestoreDatabaseId}"
VITE_FIREBASE_MEASUREMENT_ID="${secrets.measurementId}"
VITE_FIREBASE_OAUTH_CLIENT_ID="${secrets.oAuthClientId}"`;
                      handleCopy('envSnippet', envText);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'envSnippet' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'envSnippet' ? 'Copied!' : 'Copy .env snippet'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
                  {`VITE_FIREBASE_API_KEY="${secrets.apiKey || 'YOUR_API_KEY'}"
VITE_FIREBASE_AUTH_DOMAIN="${secrets.authDomain || 'YOUR_AUTH_DOMAIN'}"
VITE_FIREBASE_PROJECT_ID="${secrets.projectId || 'YOUR_PROJECT_ID'}"
VITE_FIREBASE_STORAGE_BUCKET="${secrets.storageBucket || 'YOUR_STORAGE_BUCKET'}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${secrets.messagingSenderId || 'YOUR_MESSAGING_SENDER_ID'}"
VITE_FIREBASE_APP_ID="${secrets.appId || 'YOUR_APP_ID'}"
VITE_FIREBASE_DATABASE_ID="${secrets.firestoreDatabaseId || '(default)'}"
VITE_FIREBASE_MEASUREMENT_ID="${secrets.measurementId || ''}"
VITE_FIREBASE_OAUTH_CLIENT_ID="${secrets.oAuthClientId || ''}"`}
                </pre>
              </div>

              {/* JSON config snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 font-mono">firebase-applet-config.json</span>
                  <button
                    onClick={() => {
                      const jsonText = JSON.stringify(
                        {
                          projectId: secrets.projectId,
                          appId: secrets.appId,
                          apiKey: secrets.apiKey,
                          authDomain: secrets.authDomain,
                          firestoreDatabaseId: secrets.firestoreDatabaseId,
                          storageBucket: secrets.storageBucket,
                          messagingSenderId: secrets.messagingSenderId,
                          measurementId: secrets.measurementId,
                          oAuthClientId: secrets.oAuthClientId,
                          recaptchaSiteKey: secrets.recaptchaSiteKey,
                        },
                        null,
                        2
                      );
                      handleCopy('jsonSnippet', jsonText);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'jsonSnippet' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'jsonSnippet' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-44 leading-relaxed">
                  {JSON.stringify(
                    {
                      projectId: secrets.projectId,
                      appId: secrets.appId,
                      apiKey: secrets.apiKey,
                      authDomain: secrets.authDomain,
                      firestoreDatabaseId: secrets.firestoreDatabaseId,
                      storageBucket: secrets.storageBucket,
                      messagingSenderId: secrets.messagingSenderId,
                      measurementId: secrets.measurementId,
                      oAuthClientId: secrets.oAuthClientId,
                      recaptchaSiteKey: secrets.recaptchaSiteKey,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetToDefaults}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
              title="Reset values to current workspace defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
            {saveFeedback && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {saveFeedback}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
            >
              Close
            </button>
            <button
              onClick={handleSaveSecrets}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-200 transition active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Secrets...' : 'Save Secrets'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

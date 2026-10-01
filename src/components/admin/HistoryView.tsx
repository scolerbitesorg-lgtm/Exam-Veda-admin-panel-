import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ArrowRight,
  RefreshCw,
  Shield,
  Laptop,
  Smartphone,
  Globe,
  UserCheck,
  BookOpen,
  FolderTree,
  Video,
  FileText,
  HelpCircle,
  Settings,
  Sparkles,
  Calendar,
  Layers,
  FileJson,
  X,
  Check,
  Archive,
  Lock,
  ArrowUpRight,
  Activity,
  Award,
} from 'lucide-react';
import {
  subscribeActivityHistory,
  subscribeLoginHistory,
  restoreEntityFromHistory,
  clearActivityHistoryLog,
  clearLoginHistoryLog,
  logActivity,
} from '../../services/historyService';
import type {
  ActivityHistoryRecord,
  LoginHistoryRecord,
  HistoryEntityType,
  HistoryActionType,
  UserRole,
  AdminTab,
} from '../../types';

interface HistoryViewProps {
  onNavigateTab?: (tab: AdminTab) => void;
}

type HistoryTab =
  | 'archive'
  | 'all'
  | 'logins'
  | 'subjects'
  | 'lectures'
  | 'notes'
  | 'mcqs'
  | 'mocktests'
  | 'users'
  | 'settings'
  | 'restores';

function formatExactTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

function formatRelativeTime(isoStr: string): string {
  try {
    const time = new Date(isoStr).getTime();
    if (isNaN(time)) return '';
    const diffSec = Math.floor((Date.now() - time) / 1000);
    if (diffSec < 45) return 'Just now (अभी)';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 2) return 'Yesterday (कल)';
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return '';
  }
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('archive');
  const [activityRecords, setActivityRecords] = useState<ActivityHistoryRecord[]>([]);
  const [loginRecords, setLoginRecords] = useState<LoginHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal inspection states
  const [selectedActivity, setSelectedActivity] = useState<ActivityHistoryRecord | null>(null);
  const [selectedLogin, setSelectedLogin] = useState<LoginHistoryRecord | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Restore action loading state
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ id: string; message: string } | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    const unsubActivity = subscribeActivityHistory((data) => setActivityRecords(data));
    const unsubLogin = subscribeLoginHistory((data) => setLoginRecords(data));
    return () => {
      unsubActivity();
      unsubLogin();
    };
  }, []);

  // Filter helper for accurate dates
  const isWithinDateRange = (timestampStr: string): boolean => {
    if (dateFilter === 'all') return true;
    const time = new Date(timestampStr).getTime();
    if (isNaN(time)) return true;
    const now = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return time >= today.getTime();
    }
    if (dateFilter === 'yesterday') {
      const startYesterday = new Date();
      startYesterday.setDate(startYesterday.getDate() - 1);
      startYesterday.setHours(0, 0, 0, 0);
      const endYesterday = new Date();
      endYesterday.setDate(endYesterday.getDate() - 1);
      endYesterday.setHours(23, 59, 59, 999);
      return time >= startYesterday.getTime() && time <= endYesterday.getTime();
    }
    if (dateFilter === '7days') {
      return time >= now - 7 * dayMs;
    }
    if (dateFilter === '30days') {
      return time >= now - 30 * dayMs;
    }
    if (dateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate).getTime();
        if (!isNaN(start) && time < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        const endMs = end.getTime();
        if (!isNaN(endMs) && time > endMs) return false;
      }
      return true;
    }
    return true;
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activityRecords.filter((rec) => {
      // Tab filter
      if (activeTab === 'archive') {
        if (rec.action !== 'delete' && !rec.canRestore) return false;
      } else if (activeTab === 'subjects') {
        if (!['subject', 'topic'].includes(rec.entityType)) return false;
      } else if (activeTab === 'lectures') {
        if (rec.entityType !== 'lecture') return false;
      } else if (activeTab === 'notes') {
        if (rec.entityType !== 'note') return false;
      } else if (activeTab === 'mcqs') {
        if (rec.entityType !== 'mcq') return false;
      } else if (activeTab === 'mocktests') {
        if (rec.entityType !== 'mockTest') return false;
      } else if (activeTab === 'users') {
        if (!['user', 'role'].includes(rec.entityType)) return false;
      } else if (activeTab === 'settings') {
        if (!['appSettings', 'banner', 'system'].includes(rec.entityType)) return false;
      } else if (activeTab === 'restores') {
        if (rec.action !== 're_add' && rec.action !== 'restore' && !rec.isRestored) return false;
      }

      // Action Filter
      if (actionFilter !== 'all' && rec.action !== actionFilter) return false;

      // Date Filter
      if (!isWithinDateRange(rec.timestamp)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = rec.entityTitle.toLowerCase().includes(q);
        const matchSummary = rec.summary.toLowerCase().includes(q);
        const matchActor = (rec.actorEmail || '').toLowerCase().includes(q) || (rec.actorName || '').toLowerCase().includes(q);
        const matchTags = (rec.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchActor && !matchTags) return false;
      }

      return true;
    });
  }, [activityRecords, activeTab, actionFilter, dateFilter, customStartDate, customEndDate, searchQuery]);

  // Filtered Logins
  const filteredLogins = useMemo(() => {
    return loginRecords.filter((log) => {
      if (!isWithinDateRange(log.loginAt)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = (log.userEmail || '').toLowerCase().includes(q) || (log.userName || '').toLowerCase().includes(q);
        const matchIp = (log.ipAddress || '').toLowerCase().includes(q);
        const matchBrowser = (log.browser || '').toLowerCase().includes(q) || (log.os || '').toLowerCase().includes(q);
        if (!matchUser && !matchIp && !matchBrowser) return false;
      }

      return true;
    });
  }, [loginRecords, dateFilter, customStartDate, customEndDate, searchQuery]);

  // Handle Restore / Re-add
  const handleRestore = async (rec: ActivityHistoryRecord) => {
    if (!rec.previousData && !rec.newData) {
      alert('इस रिकॉर्ड का कोई स्नैपशॉट उपलब्ध नहीं है।');
      return;
    }
    const confirmMsg = `क्या आप "${rec.entityTitle}" को डेटाबेस में पुनः जोड़ना / रीस्टोर करना चाहते हैं?`;
    if (!window.confirm(confirmMsg)) return;

    setRestoringId(rec.id);
    try {
      const res = await restoreEntityFromHistory(rec);
      setRestoreFeedback({ id: rec.id, message: res.message });
      setTimeout(() => setRestoreFeedback(null), 4500);
    } catch (err: any) {
      alert('रीस्टोर करने में त्रुटि: ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  // Export handlers
  const handleExportJSON = () => {
    const dataToExport = activeTab === 'logins' ? filteredLogins : filteredActivities;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduveda_vault_${activeTab}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csv = '';
    if (activeTab === 'logins') {
      csv = 'LoginAt,UserEmail,UserName,Role,Status,Browser,OS,IPAddress,AuthMethod\n';
      filteredLogins.forEach((l) => {
        csv += `"${l.loginAt}","${l.userEmail}","${l.userName}","${l.userRole}","${l.status}","${l.browser || ''}","${l.os || ''}","${l.ipAddress || ''}","${l.authMethod || ''}"\n`;
      });
    } else {
      csv = 'Timestamp,EntityType,EntityTitle,Action,ActorEmail,ActorName,ActorRole,Summary,Restored\n';
      filteredActivities.forEach((a) => {
        csv += `"${a.timestamp}","${a.entityType}","${a.entityTitle.replace(/"/g, '""')}","${a.action}","${a.actorEmail}","${a.actorName}","${a.actorRole}","${a.summary.replace(/"/g, '""')}","${a.isRestored ? 'Yes' : 'No'}"\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduveda_vault_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper icons and colors
  const getEntityIcon = (type: HistoryEntityType) => {
    switch (type) {
      case 'subject':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'topic':
        return <FolderTree className="w-4 h-4 text-blue-600" />;
      case 'lecture':
        return <Video className="w-4 h-4 text-emerald-600" />;
      case 'note':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'mcq':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'mockTest':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'user':
      case 'role':
        return <Shield className="w-4 h-4 text-cyan-600" />;
      case 'appSettings':
      case 'banner':
      case 'system':
        return <Settings className="w-4 h-4 text-slate-700" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getActionBadge = (action: HistoryActionType) => {
    switch (action) {
      case 'create':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">Created</span>;
      case 'update':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase">Updated</span>;
      case 'delete':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase flex items-center gap-1"><Trash2 className="w-2.5 h-2.5" /> Deleted / In Vault</span>;
      case 'publish':
        return <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase">Published</span>;
      case 'unpublish':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">Unpublished</span>;
      case 're_add':
      case 'restore':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase flex items-center gap-1"><RotateCcw className="w-2.5 h-2.5" /> Re-Added</span>;
      case 'role_change':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase">Role Grant</span>;
      case 'settings_change':
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-black uppercase">Settings</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase">{action}</span>;
    }
  };

  const recoverableCount = activityRecords.filter((a) => a.action === 'delete' && (a.previousData || a.newData)).length;
  const restoredCount = activityRecords.filter((a) => a.action === 're_add' || a.isRestored).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Archive Vault Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Archive & Audit Vault (इतिहास, आर्काइव व रिकवरी वॉल्ट)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized Archive Vault for 1-click restoration of deleted items, real-time user surveillance, and audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Download JSON vault log"
          >
            <FileJson className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Clear history logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'archive'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-200'
              : 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase">Archive / Deleted</span>
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Archive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-purple-950">{recoverableCount}</span>
            <span className="text-[10px] font-bold text-purple-700">1-Click Re-Add</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'all'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-indigo-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900 uppercase">Total Audit Trail</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-950">{activityRecords.length}</span>
            <span className="text-[10px] font-bold text-indigo-700">All Changes</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logins')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'logins'
              ? 'bg-cyan-50/80 border-cyan-300 ring-2 ring-cyan-200'
              : 'bg-white border-slate-200 hover:border-cyan-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-900 uppercase">User Surveillance</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-cyan-950">{loginRecords.length}</span>
            <span className="text-[10px] font-bold text-cyan-700">
              {loginRecords.filter((l) => l.status === 'success').length} Logins
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restores')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'restores'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-emerald-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase">Restorations</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-950">{restoredCount}</span>
            <span className="text-[10px] font-bold text-emerald-700">Re-Added</span>
          </div>
        </button>
      </div>

      {/* Restore Feedback Notification */}
      {restoreFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{restoreFeedback.message}</span>
          </div>
          <button onClick={() => setRestoreFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto text-xs font-extrabold scrollbar-none">
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'archive'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archive Vault (हटाया गया डेटा व रीस्टोर)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'archive' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
            {recoverableCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>All Activities (समस्त बदलाव)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
            {activityRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logins')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'logins'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
          <span>User Surveillance & Logins (लॉगिन निगरानी)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-50 text-[10px] font-bold text-cyan-800">
            {loginRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Subjects & Topics (विषय)</span>
        </button>

        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'lectures'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-emerald-600" />
          <span>Video Lectures (वीडियो)</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>Notes & PDFs (नोट्स)</span>
        </button>

        <button
          onClick={() => setActiveTab('mcqs')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'mcqs'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>MCQs Bank (प्रश्नोत्तरी)</span>
        </button>

        <button
          onClick={() => setActiveTab('mocktests')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'mocktests'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>Mock Tests (मॉक टेस्ट)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span>Staff & Roles (स्टाफ व रोल्स)</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-700" />
          <span>Settings & Ads (सेटिंग्स व विज्ञापन)</span>
        </button>

        <button
          onClick={() => setActiveTab('restores')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'restores'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
          <span>Restored History (पुनः जोड़े गए)</span>
        </button>
      </div>

      {/* Filter & Search Bar with Precision Timing Source */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'logins'
                ? 'ईमेल, उपयोगकर्ता नाम, आईपी या ब्राउज़र द्वारा खोजें...'
                : 'शीर्षक, सारांश, ऑथर ईमेल, आईडी या टैग द्वारा खोजें...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-slate-50/50"
          />
        </div>

        {/* Timing and Action Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeTab !== 'logins' && activeTab !== 'archive' && (
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 text-xs focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Actions (सभी क्रियाएँ)</option>
              <option value="create">Created (नया जोड़ा गया)</option>
              <option value="update">Updated (संशोधित)</option>
              <option value="delete">Deleted (हटाया गया / Vault)</option>
              <option value="publish">Published (लाइव)</option>
              <option value="re_add">Re-Added / Restored (पुनः जोड़ा)</option>
              <option value="role_change">Role Changed (अधिकार बदलाव)</option>
              <option value="settings_change">Settings (सेटिंग्स)</option>
            </select>
          )}

          {/* Accurate Time Filter Selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-700 text-xs outline-none cursor-pointer pr-2 py-1"
            >
              <option value="all">All Time (समस्त समय)</option>
              <option value="today">Today (आज का सटीक डेटा)</option>
              <option value="yesterday">Yesterday (बीते 24 घंटे)</option>
              <option value="7days">Last 7 Days (पिछले 7 दिन)</option>
              <option value="30days">Last 30 Days (पिछले 30 दिन)</option>
              <option value="custom">Custom Date Range (कस्टम दिनांक सीमा)</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              />
            </div>
          )}

          {(searchQuery || actionFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActionFilter('all');
                setDateFilter('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="रीसेट करें (Reset Filters)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'logins' ? (
        /* ================= 1. USER SURVEILLANCE & LOGIN SETTLEMENTS ================= */
        <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <h2 className="font-extrabold text-xs text-slate-900">
                User Access & Login Surveillance ({filteredLogins.length} Records)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Accurate timing & network logs for security monitoring
            </span>
          </div>

          {filteredLogins.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              कोई लॉगिन रिकॉर्ड नहीं मिला।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-black uppercase">
                    <th className="py-2.5 px-4">User & Role</th>
                    <th className="py-2.5 px-4">Status & Method</th>
                    <th className="py-2.5 px-4">Device / OS / Browser</th>
                    <th className="py-2.5 px-4">IP & Location Source</th>
                    <th className="py-2.5 px-4">Accurate Login Time (IST)</th>
                    <th className="py-2.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredLogins.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{log.userName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{log.userEmail}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase">
                          {log.userRole}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {log.status === 'success' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Success
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Failed
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 capitalize font-medium">
                            {log.authMethod?.replace('_', ' ')}
                          </span>
                        </div>
                        {log.failureReason && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                            {log.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          {log.deviceType === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{log.browser || 'Web Browser'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{log.os || 'Unknown OS'}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{log.ipAddress || '157.34.122.90'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-bold font-mono text-xs">
                          {formatExactTime(log.loginAt)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {formatRelativeTime(log.loginAt)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLogin(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ================= 2. ARCHIVE VAULT & AUDIT LOGS ================= */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700">
              Showing {filteredActivities.length} {activeTab === 'archive' ? 'archived recoverable records' : 'activity events'}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time synchronization active
            </span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-400 text-xs">
              {activeTab === 'archive'
                ? 'आर्काइव वॉल्ट खाली है। कोई हटाया गया रिकॉर्ड मौजूद नहीं है।'
                : 'इस श्रेणी में कोई इतिहास रिकॉर्ड नहीं मिला।'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((rec) => {
                const isRestoringThis = restoringId === rec.id;
                const canRestore = rec.canRestore && (rec.previousData || rec.newData);

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-2xl bg-white border transition shadow-2xs hover:shadow-xs space-y-2.5 ${
                      rec.action === 'delete'
                        ? 'border-purple-200/90 bg-purple-50/20'
                        : rec.action === 're_add' || rec.isRestored
                        ? 'border-emerald-200/80 bg-emerald-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          {getEntityIcon(rec.entityType)}
                        </div>

                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {rec.entityTitle}
                        </span>

                        {getActionBadge(rec.action)}

                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] capitalize">
                          {rec.entityType}
                        </span>

                        {rec.isRestored && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Restored to Database
                          </span>
                        )}
                      </div>

                      {/* Right-side Action & Accurate Timestamp */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right text-[11px] text-slate-500">
                          <div className="font-bold text-slate-800 font-mono">
                            {formatExactTime(rec.timestamp)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatRelativeTime(rec.timestamp)}
                          </div>
                        </div>

                        {/* 1-Click Re-Add / Restore Button */}
                        {canRestore && (
                          <button
                            onClick={() => handleRestore(rec)}
                            disabled={isRestoringThis}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm shadow-purple-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                            title="इस आइटम को डेटाबेस में पुनः जोड़ें / रीस्टोर करें"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRestoringThis ? 'animate-spin' : ''}`} />
                            <span>{isRestoringThis ? 'Re-Adding...' : 'पुनः जोड़ें (Re-Add)'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedActivity(rec)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="स्नैपशॉट व विवरण देखें"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Summary & Actor Info */}
                    <div className="text-xs text-slate-700 leading-relaxed font-sans">
                      {rec.summary}
                    </div>

                    {rec.details && (
                      <div className="text-[11px] text-slate-500 font-sans italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {rec.details}
                      </div>
                    )}

                    {/* Footer actor & tags */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">
                          By: <strong className="text-indigo-600">{rec.actorName}</strong> ({rec.actorEmail})
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 font-bold text-[9px] uppercase text-slate-600">
                          {rec.actorRole}
                        </span>
                      </div>

                      {rec.tags && rec.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {rec.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ACTIVITY SNAPSHOT INSPECTOR ================= */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Archive Snapshot & Audit Details (वॉल्ट विवरण)
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-extrabold text-slate-900 text-sm">{selectedActivity.entityTitle}</div>
                <div className="flex items-center gap-2">
                  {getActionBadge(selectedActivity.action)}
                  <span className="font-bold text-slate-600 capitalize">Type: {selectedActivity.entityType}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">ID: {selectedActivity.entityId}</span>
                </div>
                <p className="text-slate-700 pt-1">{selectedActivity.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <strong className="text-slate-500 block">Actor / Author:</strong>
                  <span className="font-bold text-slate-900">{selectedActivity.actorName}</span>
                  <div className="text-slate-500 font-mono">{selectedActivity.actorEmail}</div>
                </div>
                <div>
                  <strong className="text-slate-500 block">Exact Timestamp (IST):</strong>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatExactTime(selectedActivity.timestamp)}
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {formatRelativeTime(selectedActivity.timestamp)}
                  </div>
                </div>
              </div>

              {/* Data Snapshot JSON View */}
              {(selectedActivity.previousData || selectedActivity.newData) && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preserved Data Snapshot (रीस्टोर करने योग्य डेटा):
                  </label>
                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                    {JSON.stringify(selectedActivity.previousData || selectedActivity.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              {(selectedActivity.previousData || selectedActivity.newData) && (
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedActivity;
                    setSelectedActivity(null);
                    handleRestore(rec);
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>पुनः जोड़ें / Re-Add to Database</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOGIN DETAILS INSPECTOR ================= */}
      {selectedLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Login Session Audit Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogin(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">{selectedLogin.userName}</div>
                <div className="text-slate-500 font-mono text-[11px]">{selectedLogin.userEmail}</div>
                <div className="pt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                    Role: {selectedLogin.userRole}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    selectedLogin.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedLogin.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-500 block">Device & OS:</strong>
                  <span className="font-bold text-slate-800">{selectedLogin.deviceType} • {selectedLogin.os}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-500 block">Browser:</strong>
                  <span className="font-bold text-slate-800">{selectedLogin.browser}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-500 block">IP / Network:</strong>
                  <span className="font-mono text-slate-800 font-semibold">{selectedLogin.ipAddress}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-500 block">Auth Method:</strong>
                  <span className="font-bold text-slate-800 capitalize">{selectedLogin.authMethod}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <strong className="text-slate-500 block">Exact Login Time (IST):</strong>
                <span className="font-mono font-bold text-slate-900">{formatExactTime(selectedLogin.loginAt)}</span>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {formatRelativeTime(selectedLogin.loginAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLogin(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLEAR HISTORY LOGS CONFIRMATION ================= */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  इतिहास लॉग साफ़ करें (Clear History)?
                </h3>
                <p className="text-xs text-slate-500">
                  यह क्रिया संग्रहीत गतिविधि व लॉगिन लॉग्स को हटा देगी।
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-2xl border border-amber-200">
              ⚠️ <strong>ध्यान दें:</strong> लॉग्स साफ़ करने के बाद पुराने हटाए गए कंटेंट को रीस्टोर (Re-Add) करने के स्नैपशॉट्स नष्ट हो सकते हैं।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  try {
                    await clearActivityHistoryLog();
                    await clearLoginHistoryLog();
                    setShowClearConfirmModal(false);
                    setRestoreFeedback({ id: 'cleared', message: 'इतिहास लॉग्स सफलतापूर्वक साफ़ कर दिए गए हैं।' });
                    setTimeout(() => setRestoreFeedback(null), 4000);
                  } catch (err: any) {
                    alert('Error clearing logs: ' + err.message);
                  } finally {
                    setIsClearing(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
              >
                {isClearing ? 'साफ़ कर रहे हैं...' : 'हाँ, साफ़ करें (Confirm Clear)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

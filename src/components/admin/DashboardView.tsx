import React, { useState } from 'react';
import {
  BookOpen,
  FolderTree,
  Video,
  FileText,
  HelpCircle,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Database,
  Smartphone,
  Plus,
  RefreshCw,
  AlertCircle,
  Layers,
  Award,
  Trash2,
  X,
  Lock,
  Code2,
  ShieldCheck,
  Key,
  Shield,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Filter,
  Check,
  Zap,
  Activity,
  UserCheck,
  BarChart3,
  Calendar,
  Eye,
  Flame,
  FileCode,
} from 'lucide-react';
import { clearAllEducationalData } from '../../services/seedData';
import { useAuth } from '../../context/AuthContext';
import { FirebaseSecretsModal } from './FirebaseSecretsModal';
import { db, currentDatabaseId } from '../../firebase/config';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfigData from '../../../firebase-applet-config.json';
import type {
  Subject,
  Topic,
  Lecture,
  Note,
  MCQ,
  MockTest,
  MockAttempt,
  UserProfile,
  AppSettings,
  AdminTab,
} from '../../types';

interface DashboardViewProps {
  subjects: Subject[];
  topics: Topic[];
  lectures: Lecture[];
  notes: Note[];
  mcqs: MCQ[];
  mockTests: MockTest[];
  users: UserProfile[];
  mockAttempts: MockAttempt[];
  appSettings: AppSettings;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenStudentPreview: () => void;
  onQuickAction: (action: 'subject' | 'topic' | 'lecture' | 'note' | 'mcq' | 'mock') => void;
  onSettingsUpdated?: (updated: AppSettings) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjects,
  topics,
  lectures,
  notes,
  mcqs,
  mockTests,
  users,
  mockAttempts,
  appSettings,
  onNavigateTab,
  onOpenStudentPreview,
  onQuickAction,
  onSettingsUpdated,
}) => {
  const { isDeveloper, userProfile, currentUser } = useAuth();

  // Modal states
  const [showFirebaseSecretsModal, setShowFirebaseSecretsModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  // Live Ping connection test state on dashboard
  const [isPinging, setIsPinging] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'connected' | 'checking' | 'error'>('connected');

  // Activity filter state
  const [activityFilter, setActivityFilter] = useState<'all' | 'attempts' | 'content'>('all');

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingStatus('checking');
    const start = performance.now();
    try {
      const pingDocRef = doc(db, '_connection_test', 'dashboard_ping');
      await setDoc(pingDocRef, {
        checkedBy: currentUser?.email || 'admin',
        timestamp: new Date().toISOString(),
        client: 'Edu Veda Dashboard',
      });
      const snap = await getDoc(pingDocRef);
      if (snap.exists()) {
        const latency = Math.round(performance.now() - start);
        setPingLatency(Math.max(latency, 22));
        setPingStatus('connected');
        await deleteDoc(pingDocRef).catch(() => {});
      } else {
        setPingStatus('error');
      }
    } catch (err) {
      console.error('Ping error:', err);
      setPingStatus('error');
    } finally {
      setIsPinging(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!isDeveloper) {
      alert('Only Lead Developers can delete database records.');
      return;
    }
    setIsPurging(true);
    setShowPurgeModal(false);
    setSeedSuccess(null);
    try {
      const res = await clearAllEducationalData();
      setSeedSuccess(`🗑️ Successfully purged all ${res.deletedCount} items! Database is now clean.`);
      setTimeout(() => setSeedSuccess(null), 6000);
    } catch (err: any) {
      alert('Error purging data: ' + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Metrics Calculations
  const publishedSubjects = subjects.filter((s) => s.published !== false).length;
  const draftSubjects = subjects.length - publishedSubjects;
  const publishedMockTests = mockTests.filter((m) => m.published !== false).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;
  const studentUsers = users.filter((u) => u.role !== 'admin').length;

  const totalAttempts = mockAttempts.length;
  const avgScorePercentage =
    totalAttempts > 0
      ? Math.round(mockAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalAttempts)
      : 0;

  // Active Firebase details
  const activeProjectId =
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    appSettings?.customFirebaseConfig?.projectId ||
    appSettings?.adminFirebaseSecrets?.projectId ||
    firebaseConfigData.projectId ||
    'gen-lang-client-0740216505';

  const activeDatabaseId =
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    appSettings?.customFirebaseConfig?.firestoreDatabaseId ||
    appSettings?.adminFirebaseSecrets?.firestoreDatabaseId ||
    firebaseConfigData.firestoreDatabaseId ||
    currentDatabaseId;

  const activeApiKey =
    import.meta.env.VITE_FIREBASE_API_KEY ||
    appSettings?.customFirebaseConfig?.apiKey ||
    appSettings?.adminFirebaseSecrets?.apiKey ||
    firebaseConfigData.apiKey ||
    '';

  const maskedApiKey = activeApiKey
    ? `${activeApiKey.slice(0, 8)}••••••••${activeApiKey.slice(-4)}`
    : 'Not configured';

  // Navigation Items Definition for direct routing
  const primaryNavCards: {
    id: AdminTab;
    title: string;
    hindiTitle: string;
    count: number;
    badge: string;
    badgeColor: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    description: string;
    quickAction?: 'subject' | 'topic' | 'lecture' | 'note' | 'mcq' | 'mock';
  }[] = [
    {
      id: 'subjects',
      title: 'Subjects',
      hindiTitle: 'विषय प्रबंधन',
      count: subjects.length,
      badge: `${publishedSubjects} Published`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: BookOpen,
      iconBg: 'bg-indigo-50 border-indigo-100',
      iconColor: 'text-indigo-600',
      description: 'Define syllabus streams, course hierarchies, and display orders.',
      quickAction: 'subject',
    },
    {
      id: 'topics',
      title: 'Topics',
      hindiTitle: 'अध्याय एवं यूनिट्स',
      count: topics.length,
      badge: `${topics.length} Chapters`,
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: FolderTree,
      iconBg: 'bg-violet-50 border-violet-100',
      iconColor: 'text-violet-600',
      description: 'Group content chapters under subjects with ordered sub-modules.',
      quickAction: 'topic',
    },
    {
      id: 'lectures',
      title: 'Lectures',
      hindiTitle: 'वीडियो व्याख्यान',
      count: lectures.length,
      badge: 'Video Stream',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: Video,
      iconBg: 'bg-sky-50 border-sky-100',
      iconColor: 'text-sky-600',
      description: 'Upload video lectures, set durations, and attach player timestamps.',
      quickAction: 'lecture',
    },
    {
      id: 'mcqs',
      title: 'MCQs Bank',
      hindiTitle: 'प्रश्नोत्तरी बैंक',
      count: mcqs.length,
      badge: 'Bilingual Bank',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: HelpCircle,
      iconBg: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-600',
      description: 'Interactive question bank with 4 options and detailed solutions.',
      quickAction: 'mcq',
    },
    {
      id: 'mocktests',
      title: 'Mock Tests',
      hindiTitle: 'मॉक टेस्ट परीक्षा',
      count: mockTests.length,
      badge: `${publishedMockTests} Live Tests`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Clock,
      iconBg: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-600',
      description: 'Full-length timed exam simulators with NTA-style question palettes.',
      quickAction: 'mock',
    },
    {
      id: 'users',
      title: 'Users & Attempts',
      hindiTitle: 'छात्र एवं सदस्य',
      count: users.length,
      badge: `${studentUsers} Students`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Users,
      iconBg: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600',
      description: 'Monitor student profiles, role permissions, and mock performance.',
    },
  ];

  // Secondary Quick Nav Items
  const secondaryNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: 'notes', label: 'Notes & PDFs', icon: FileText, count: notes.length },
    { id: 'dev-console', label: 'Remote App Theme Console', icon: Code2 },
    { id: 'settings', label: 'System Settings', icon: Layers },
  ];

  // Combined Recent Activity Stream
  const combinedRecentContent = [
    ...subjects.slice(0, 3).map((s) => ({
      id: `subj-${s.id}`,
      type: 'subject' as const,
      title: s.name,
      subtitle: `${s.hindiName || 'Subject'} • ${s.description || 'Course Stream'}`,
      timestamp: s.createdAt || s.updatedAt || 'Recent',
      icon: BookOpen,
      iconColor: 'text-indigo-600',
      badge: s.published !== false ? 'Published' : 'Draft',
      badgeClass: s.published !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
    })),
    ...topics.slice(0, 3).map((t) => ({
      id: `top-${t.id}`,
      type: 'topic' as const,
      title: t.title || t.name || 'Chapter',
      subtitle: `${t.hindiTitle || t.hindiName || 'Chapter'} • ${t.subjectName || 'Syllabus'}`,
      timestamp: t.createdAt || 'Recent',
      icon: FolderTree,
      iconColor: 'text-violet-600',
      badge: 'Chapter',
      badgeClass: 'bg-violet-50 text-violet-700',
    })),
    ...mockTests.slice(0, 2).map((m) => ({
      id: `mock-${m.id}`,
      type: 'mock' as const,
      title: m.title,
      subtitle: `${m.duration || m.durationMinutes || 60} mins • ${m.totalMarks || 100} marks`,
      timestamp: m.createdAt || 'Recent',
      icon: Clock,
      iconColor: 'text-purple-600',
      badge: m.published !== false ? 'Live Exam' : 'Draft',
      badgeClass: m.published !== false ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600',
    })),
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME & REAL-TIME SYSTEM OVERVIEW BANNER */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl ${
          isDeveloper
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 shadow-slate-950/20'
            : 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 shadow-indigo-900/15'
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/15">
                {isDeveloper ? (
                  <>
                    <Code2 className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-amber-200">Lead Developer Master Console</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
                    <span className="text-indigo-100">Academic Content Administrator</span>
                  </>
                )}
              </div>

              {/* Firestore Status Pill with Ping Button */}
              <button
                onClick={handleTestConnection}
                disabled={isPinging}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 hover:bg-emerald-500/30 transition cursor-pointer"
                title="Click to test Firestore connection latency"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isPinging
                    ? 'Pinging...'
                    : pingLatency
                    ? `Firestore: ${pingLatency}ms`
                    : 'Firestore: Connected'}
                </span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-indigo-200 to-white">Edu Veda Admin Portal</span>
            </h1>
            <p className="text-indigo-100/90 text-xs sm:text-sm leading-relaxed max-w-xl">
              Central command center for the Edu Veda learning ecosystem. Manage live curriculum, bilingual test banks, video lectures, student analytics, and cloud backend configurations in real time.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Option to Add Firebase Secrets */}
            <button
              onClick={() => setShowFirebaseSecretsModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-950/20 active:scale-95 cursor-pointer"
              title="Add or update Firebase API keys, OAuth secrets, and Service Account tokens"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Firebase Secrets & Keys</span>
            </button>

            {/* Academic Content Quick Action */}
            <button
              onClick={() => onQuickAction('subject')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-800 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>+ Add Content</span>
            </button>

            {/* Launch Mobile Preview */}
            <button
              onClick={onOpenStudentPreview}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Launch App Preview</span>
              <span className="sm:hidden">App Preview</span>
            </button>

            {/* Developer Purge Demo Data Controls */}
            {isDeveloper && (
              <button
                onClick={() => setShowPurgeModal(true)}
                disabled={isPurging}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Purge & Remove All Fake/Demo Data"
              >
                <Trash2 className={`w-4 h-4 ${isPurging ? 'animate-spin' : ''}`} />
                <span className="hidden xl:inline">Purge Demo Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Seed Success Notification */}
      {seedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{seedSuccess}</span>
          </div>
          <button onClick={() => setSeedSuccess(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KEY METRICS SHOWCASE (TOTAL USERS, TOTAL SUBJECTS, TOTAL TOPICS, & MORE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Key Performance Metrics</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Live Firestore Synchronization</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. TOTAL USERS */}
          <div
            onClick={() => onNavigateTab('users')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg transition cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition border border-blue-100">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>{studentUsers} Students</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{users.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
              <span>Total Users (उपयोगकर्ता)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Staff Admins: <strong className="text-slate-800">{adminUsers}</strong></span>
              <span>Submissions: <strong className="text-indigo-600">{totalAttempts}</strong></span>
            </div>
          </div>

          {/* 2. TOTAL SUBJECTS */}
          <div
            onClick={() => onNavigateTab('subjects')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition border border-indigo-100">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                {publishedSubjects} Live
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{subjects.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
              <span>Total Subjects (कुल विषय)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition" />
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Drafts: <strong className="text-slate-800">{draftSubjects}</strong></span>
              <span className="text-indigo-600 font-semibold hover:underline">Manage Subjects →</span>
            </div>
          </div>

          {/* 3. TOTAL TOPICS */}
          <div
            onClick={() => onNavigateTab('topics')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-lg transition cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition border border-violet-100">
                <FolderTree className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200/60 px-2 py-0.5 rounded-full">
                {subjects.length > 0 ? (topics.length / Math.max(subjects.length, 1)).toFixed(1) : 0} / Subject
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{topics.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
              <span>Total Topics (अध्याय)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-600 transition" />
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Syllabus units</span>
              <span className="text-violet-600 font-semibold hover:underline">View Chapters →</span>
            </div>
          </div>

          {/* 4. TOTAL MOCK TESTS & RESULTS */}
          <div
            onClick={() => onNavigateTab('mocktests')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-lg transition cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition border border-purple-100">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-full">
                {publishedMockTests} Live
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{mockTests.length}</div>
            <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
              <span>Mock Tests (मॉक टेस्ट)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 transition" />
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Total Attempts: <strong className="text-purple-700">{totalAttempts}</strong></span>
              <span>Avg Score: <strong className="text-emerald-600">{avgScorePercentage}%</strong></span>
            </div>
          </div>
        </div>

        {/* Secondary Metric Strips: Lectures, Notes, MCQs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => onNavigateTab('lectures')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 flex items-center justify-between cursor-pointer transition shadow-2xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{lectures.length} Lectures</div>
                <div className="text-[11px] text-slate-400">Video streaming lessons</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition" />
          </div>

          <div
            onClick={() => onNavigateTab('notes')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 flex items-center justify-between cursor-pointer transition shadow-2xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{notes.length} Notes & PDFs</div>
                <div className="text-[11px] text-slate-400">Bilingual revision guides</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
          </div>

          <div
            onClick={() => onNavigateTab('mcqs')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 flex items-center justify-between cursor-pointer transition shadow-2xs group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{mcqs.length} MCQs in Bank</div>
                <div className="text-[11px] text-slate-400">With 4 options & solutions</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
          </div>
        </div>
      </div>

      {/* 3. FIREBASE SECRETS & BACKEND CREDENTIALS MANAGEMENT PANEL */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Firebase Secrets & Backend Configuration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {pingStatus === 'connected' ? 'Active & Synced' : pingStatus === 'checking' ? 'Checking...' : 'Check Needed'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Configure your Web API Key, Project ID, Database ID, Google OAuth credentials, and Service Account tokens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTestConnection}
              disabled={isPinging}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/10"
              title="Test real-time connection to Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isPinging ? 'Pinging...' : pingLatency ? `Ping: ${pingLatency}ms` : 'Ping Database'}</span>
            </button>
            <button
              onClick={() => setShowFirebaseSecretsModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-950/20 active:scale-95"
            >
              <Key className="w-4 h-4" />
              <span>Add / Edit Firebase Secrets</span>
            </button>
          </div>
        </div>

        {/* Firebase Credentials Snapshot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 text-xs">
          {/* Project ID */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Firebase Project ID</span>
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono font-bold text-indigo-300 text-xs truncate" title={activeProjectId}>
              {activeProjectId}
            </div>
          </div>

          {/* Database ID */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Firestore Database</span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-mono font-bold text-emerald-300 text-xs truncate" title={activeDatabaseId}>
              {activeDatabaseId}
            </div>
          </div>

          {/* Web API Key */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Web API Key (apiKey)</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-mono text-slate-300 text-xs truncate">
              {maskedApiKey}
            </div>
          </div>

          {/* Actions & Sync */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Quick Credentials</div>
              <div className="font-bold text-white text-xs mt-0.5">Secrets Manager</div>
            </div>
            <button
              onClick={() => setShowFirebaseSecretsModal(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. NAVIGATION DIRECTORY TO OTHER ADMIN SECTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Admin Sections Directory
            </h2>
          </div>
          <span className="text-xs text-slate-400">Click any section to open and manage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {primaryNavCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center border transition group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>{card.title}</span>
                      <span className="text-xs text-slate-400 font-normal">({card.hindiTitle})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    {card.count} records
                  </span>
                  <div className="flex items-center gap-2">
                    {card.quickAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAction(card.quickAction!);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs transition"
                        title={`Quick add ${card.title}`}
                      >
                        + Add
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateTab(card.id)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Section Quick Links */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-500 mr-1">Quick Shortcuts:</span>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-bold flex items-center gap-2 transition shadow-2xs cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. RECENT ACTIVITY & RECENT STUDENT SUBMISSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Recent Mock Attempts Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Recent Student Activity & Test Submissions</h3>
                  <p className="text-[11px] text-slate-500">Live scores, accuracy, and exam completion times</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActivityFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activityFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({mockAttempts.length})
                </button>
                <button
                  onClick={() => setActivityFilter('attempts')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activityFilter === 'attempts' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Attempts
                </button>
                <button
                  onClick={() => setActivityFilter('content')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    activityFilter === 'content' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Curriculum
                </button>
              </div>
            </div>

            {/* Content Feed */}
            {activityFilter === 'content' ? (
              <div className="space-y-2.5">
                {combinedRecentContent.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <Icon className={`w-4 h-4 ${item.iconColor}`} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.title}</div>
                          <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : mockAttempts.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No mock test submissions recorded yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  When students solve mock tests in the mobile app, their scores, accuracy %, and time spent will log here automatically in real time.
                </p>
                <button
                  onClick={onOpenStudentPreview}
                  className="mt-3.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
                >
                  Take a Mock Test in Preview App
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="pb-2.5">Student</th>
                      <th className="pb-2.5">Mock Test</th>
                      <th className="pb-2.5">Score</th>
                      <th className="pb-2.5">Accuracy</th>
                      <th className="pb-2.5">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockAttempts.slice(0, 7).map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3">
                          <div className="font-bold text-slate-800">{attempt.userName || 'Student'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px] font-mono">
                            {attempt.userEmail || 'learner@eduveda.in'}
                          </div>
                        </td>
                        <td className="py-3 text-slate-700 font-medium truncate max-w-[160px]">
                          {attempt.mockTitle || 'Full Mock Exam'}
                        </td>
                        <td className="py-3 font-bold text-indigo-600 font-mono">
                          {attempt.score} / {attempt.total}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                              attempt.percentage >= 60
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {Math.round(attempt.percentage)}%
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 text-[11px] font-mono">
                          {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {mockAttempts.length > 7 && (
                  <div className="pt-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => onNavigateTab('users')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      View All {mockAttempts.length} Submissions →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Create & Architecture Standards */}
        <div className="space-y-4">
          {/* Quick Create Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Quick Content Creation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Directly launch creation forms for any module
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <button
                onClick={() => onQuickAction('subject')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-indigo-600">📚 Subject</div>
                <div className="text-[10px] text-slate-400">Add course topic</div>
              </button>

              <button
                onClick={() => onQuickAction('topic')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-violet-400 hover:bg-violet-50/40 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-violet-600">📑 Topic</div>
                <div className="text-[10px] text-slate-400">Add chapter unit</div>
              </button>

              <button
                onClick={() => onQuickAction('lecture')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-sky-600">🎥 Lecture</div>
                <div className="text-[10px] text-slate-400">Add video lesson</div>
              </button>

              <button
                onClick={() => onQuickAction('note')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-amber-600">📝 Notes PDF</div>
                <div className="text-[10px] text-slate-400">Upload revision doc</div>
              </button>

              <button
                onClick={() => onQuickAction('mcq')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-emerald-600">❓ MCQ</div>
                <div className="text-[10px] text-slate-400">Add quiz question</div>
              </button>

              <button
                onClick={() => onQuickAction('mock')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition group cursor-pointer"
              >
                <div className="font-bold text-slate-800 group-hover:text-purple-600">⏱️ Mock Test</div>
                <div className="text-[10px] text-slate-400">Create timed exam</div>
              </button>
            </div>
          </div>

          {/* Architecture Hierarchy Card */}
          <div className="p-5 rounded-3xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Edu Veda Content Hierarchy
            </h3>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Standardized 3-tier structure ensuring consistent student learning progression:
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center gap-2 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="font-bold text-slate-800">1. Subject</span>
                <span className="text-[10px] text-slate-400">(e.g. Indian History)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center gap-2 ml-3 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                <span className="font-bold text-slate-800">2. Topic</span>
                <span className="text-[10px] text-slate-400">(e.g. Indus Valley)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center gap-2 ml-6 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-slate-800">3. Lecture / Note / MCQ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIREBASE SECRETS MODAL */}
      {showFirebaseSecretsModal && (
        <FirebaseSecretsModal
          isOpen={showFirebaseSecretsModal}
          onClose={() => setShowFirebaseSecretsModal(false)}
          appSettings={appSettings}
          onSettingsUpdated={onSettingsUpdated}
        />
      )}

      {/* PURGE ALL MODAL */}
      {showPurgeModal && isDeveloper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Purge All Demo Data
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Completely clean Firestore collections
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPurgeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-2 leading-relaxed">
              <p className="font-bold">⚠️ Danger Zone Action</p>
              <p className="text-[11px] opacity-90">
                Are you sure you want to delete all demo records from Firestore?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeAll}
                disabled={isPurging}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-rose-200 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPurging ? 'Deleting...' : 'Yes, Delete All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

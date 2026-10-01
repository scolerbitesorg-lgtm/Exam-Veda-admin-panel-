import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AdminNavbar } from './components/admin/AdminNavbar';
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar';
import { DashboardView } from './components/admin/DashboardView';
import { SubjectsView } from './components/admin/SubjectsView';
import { TopicsView } from './components/admin/TopicsView';
import { LecturesView } from './components/admin/LecturesView';
import { NotesView } from './components/admin/NotesView';
import { MCQsView } from './components/admin/MCQsView';
import { MockTestsView } from './components/admin/MockTestsView';
import { UsersView } from './components/admin/UsersView';
import { DeveloperConsoleView } from './components/admin/DeveloperConsoleView';
import { SettingsView } from './components/admin/SettingsView';
import { HistoryView } from './components/admin/HistoryView';
import { FirebaseSyncView } from './components/admin/FirebaseSyncView';
import { DeveloperAccessView } from './components/admin/DeveloperAccessView';
import { StudentAppPreviewModal } from './components/student-preview/StudentAppPreviewModal';
import {
  subscribeToSubjects,
  subscribeToTopics,
  subscribeToLectures,
  subscribeToNotes,
  subscribeToMCQs,
  subscribeToMockTests,
  subscribeToUsers,
  subscribeToMockAttempts,
  subscribeToMCQAttempts,
  subscribeToAppSettings,
} from './services/dbService';
import type {
  Subject,
  Topic,
  Lecture,
  Note,
  MCQ,
  MockTest,
  UserProfile,
  MockAttempt,
  MCQAttempt,
  AppSettings,
} from './types';
import {
  ArrowRight,
  Mail,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentUser,
    userProfile,
    loading: authLoading,
    signIn,
    loginAsDeveloper,
    loginAsContentAdmin,
    isDeveloper,
    isContentAdmin,
    error: authError,
    clearError,
  } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashTab = window.location.hash.replace('#', '') as AdminTab;
      const validTabs: AdminTab[] = [
        'dashboard',
        'subjects',
        'topics',
        'lectures',
        'notes',
        'mcqs',
        'mocktests',
        'users',
        'settings',
        'developer-access',
        'dev-console',
        'firebase-sync',
      ];
      if (validTabs.includes(hashTab)) return hashTab;
    }
    return 'dashboard';
  });
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isStudentPreviewOpen, setIsStudentPreviewOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<
    'subjects' | 'topics' | 'lectures' | 'notes' | 'mcqs' | 'mocktests' | null
  >(null);

  // Synchronize Tab Navigation with Browser History API for natural Back/Forward behavior
  const navigateToTab = (tab: AdminTab, pushHistory = true) => {
    setActiveTab(tab);
    setQuickCreateType(null);
    if (isSidebarMobileOpen) setIsSidebarMobileOpen(false);
    if (pushHistory && typeof window !== 'undefined') {
      const targetHash = `#${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ tab, isPreview: isStudentPreviewOpen }, '', targetHash);
      }
    }
  };

  const openStudentPreviewModal = () => {
    setIsStudentPreviewOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: activeTab, isPreview: true }, '', `#preview`);
    }
  };

  const closeStudentPreviewModal = () => {
    setIsStudentPreviewOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#preview') {
      window.history.replaceState({ tab: activeTab, isPreview: false }, '', `#${activeTab}`);
    }
  };

  // Browser Popstate (Back / Forward button) Handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize initial state if empty
    if (!window.history.state) {
      window.history.replaceState({ tab: activeTab, isPreview: isStudentPreviewOpen }, '', `#${activeTab}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If mobile sidebar is open, close it on back
      if (isSidebarMobileOpen) {
        setIsSidebarMobileOpen(false);
        return;
      }

      // 2. If quick create modal is open, close it on back
      if (quickCreateType) {
        setQuickCreateType(null);
        return;
      }

      // 3. If student preview modal is open, close it on back
      if (isStudentPreviewOpen) {
        setIsStudentPreviewOpen(false);
        return;
      }

      const state = event.state;
      if (state && state.tab) {
        setActiveTab(state.tab);
        if (typeof state.isPreview === 'boolean') {
          setIsStudentPreviewOpen(state.isPreview);
        }
      } else {
        const hash = window.location.hash.replace('#', '');
        const validTabs: AdminTab[] = [
          'dashboard',
          'subjects',
          'topics',
          'lectures',
          'notes',
          'mcqs',
          'mocktests',
          'users',
          'settings',
          'developer-access',
          'dev-console',
          'firebase-sync',
        ];
        if (hash && validTabs.includes(hash as AdminTab)) {
          setActiveTab(hash as AdminTab);
        } else {
          setActiveTab('dashboard');
        }
        setIsStudentPreviewOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isStudentPreviewOpen, isSidebarMobileOpen, quickCreateType, activeTab]);

  // Filter propagation state
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Authentication Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Application Data States
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mockAttempts, setMockAttempts] = useState<MockAttempt[]>([]);
  const [mcqAttempts, setMCQAttempts] = useState<MCQAttempt[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'Edu Veda Learning Hub',
    tagline: 'Comprehensive Exam Preparation Platform',
    bannerNotice: '📚 New Batch for 2026 Competitive Exams & Mock Test Series are now Live!',
    showBanner: true,
    maintenanceMode: false,
    themeColor: '#4f46e5',
    logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
    supportEmail: 'support@eduveda.in',
    supportPhone: '+91 98765 43210',
    version: '2.4.0',
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubSubjects = subscribeToSubjects((data) => setSubjects(data));
    const unsubTopics = subscribeToTopics((data) => setTopics(data));
    const unsubLectures = subscribeToLectures((data) => setLectures(data));
    const unsubNotes = subscribeToNotes((data) => setNotes(data));
    const unsubMCQs = subscribeToMCQs((data) => setMCQs(data));
    const unsubMockTests = subscribeToMockTests((data) => setMockTests(data));
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    const unsubMockAttempts = subscribeToMockAttempts((data) => setMockAttempts(data));
    const unsubMCQAttempts = subscribeToMCQAttempts((data) => setMCQAttempts(data));
    const unsubSettings = subscribeToAppSettings((data) => {
      if (data) setAppSettings(data);
    });

    return () => {
      unsubSubjects();
      unsubTopics();
      unsubLectures();
      unsubNotes();
      unsubMCQs();
      unsubMockTests();
      unsubUsers();
      unsubMockAttempts();
      unsubMCQAttempts();
      unsubSettings();
    };
  }, []);

  const handleQuickAction = (action: 'subject' | 'topic' | 'lecture' | 'note' | 'mcq' | 'mock') => {
    if (action === 'subject') {
      navigateToTab('subjects');
      setQuickCreateType('subjects');
    } else if (action === 'topic') {
      navigateToTab('topics');
      setQuickCreateType('topics');
    } else if (action === 'lecture') {
      navigateToTab('lectures');
      setQuickCreateType('lectures');
    } else if (action === 'note') {
      navigateToTab('notes');
      setQuickCreateType('notes');
    } else if (action === 'mcq') {
      navigateToTab('mcqs');
      setQuickCreateType('mcqs');
    } else if (action === 'mock') {
      navigateToTab('mocktests');
      setQuickCreateType('mocktests');
    }
  };

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    try {
      await signIn(loginEmail, loginPassword);
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Auto redirect content_admin away from developer-only tabs (settings is now accessible to admins)
  useEffect(() => {
    const devOnlyTabs: AdminTab[] = ['dev-console', 'firebase-sync', 'developer-access'];
    if (!isDeveloper && devOnlyTabs.includes(activeTab)) {
      navigateToTab('dashboard', false);
    }
  }, [activeTab, isDeveloper]);

  // If loading authentication state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  // Clean, professional login interface without demo credentials or suggestions
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md shadow-indigo-300">
              EV
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Edu Veda
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Staff & Admin Access Portal
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Login Failed: </span>
                <span>{authError}</span>
              </div>
            </div>
          )}

          {/* Clean Login Form */}
          <form onSubmit={handleLoginFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your official email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-medium text-slate-900 outline-hidden transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="text-slate-500 hover:text-indigo-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {showLoginPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-medium text-slate-900 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{loginSubmitting ? 'Signing In...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure footer */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              🔒 Edu Veda Secured Management Gateway
            </p>
          </div>
        </div>
      </div>
    );
  }

  // App Counts
  const counts = {
    subjects: subjects.length,
    topics: topics.length,
    lectures: lectures.length,
    notes: notes.length,
    mcqs: mcqs.length,
    mocktests: mockTests.length,
    users: users.length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Top Navigation Bar */}
      <AdminNavbar
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
        onOpenStudentPreview={openStudentPreviewModal}
        onQuickAction={handleQuickAction}
        appSettings={appSettings}
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
      />

      {/* Global Notice Marquee (Developer controlled) */}
      {appSettings.showBanner && appSettings.bannerNotice && (
        <div className="bg-indigo-900 text-indigo-100 text-xs px-4 py-2 flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-2 max-w-5xl mx-auto truncate font-medium">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase shrink-0">
              Live Banner
            </span>
            <span className="truncate">{appSettings.bannerNotice}</span>
          </div>
        </div>
      )}

      {/* Main Sidebar */}
      <AdminSidebar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          navigateToTab(tab);
        }}
        counts={counts}
        onOpenStudentPreview={openStudentPreviewModal}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Desktop Sidebar Spacer */}
        <div className="w-72 shrink-0 hidden lg:block" />

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0">
          {/* Mobile & Top Tab Switcher */}
          <div className="md:hidden mb-4 overflow-x-auto pb-1 flex items-center gap-1.5 text-xs">
            {(
              isDeveloper
                ? ([
                    'dashboard',
                    'subjects',
                    'topics',
                    'lectures',
                    'notes',
                    'mcqs',
                    'mocktests',
                    'users',
                    'history',
                    'settings',
                    'dev-console',
                  ] as AdminTab[])
                : ([
                    'dashboard',
                    'subjects',
                    'topics',
                    'lectures',
                    'notes',
                    'mcqs',
                    'mocktests',
                    'users',
                  ] as AdminTab[])
            ).map((t) => (
              <button
                key={t}
                onClick={() => navigateToTab(t)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap capitalize transition ${
                  activeTab === t ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600'
                }`}
              >
                {t === 'mocktests'
                  ? 'Mock Tests'
                  : t === 'dev-console'
                  ? 'Dev Console'
                  : t === 'history'
                  ? 'Archive Vault'
                  : t === 'settings'
                  ? 'App Settings'
                  : t === 'users'
                  ? isDeveloper
                    ? 'Team & Students'
                    : 'Student Submissions'
                  : t.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Dynamic View Panels */}
          {activeTab === 'dashboard' && (
            <DashboardView
              subjects={subjects}
              topics={topics}
              lectures={lectures}
              notes={notes}
              mcqs={mcqs}
              mockTests={mockTests}
              users={users}
              mockAttempts={mockAttempts}
              appSettings={appSettings}
              onNavigateTab={navigateToTab}
              onOpenStudentPreview={openStudentPreviewModal}
              onQuickAction={handleQuickAction}
              onSettingsUpdated={(updated) => setAppSettings(updated)}
            />
          )}

          {/* Master Archive Vault & Audit Trail - Strictly Developer Only */}
          {activeTab === 'history' && (
            isDeveloper ? (
              <HistoryView onNavigateTab={navigateToTab} />
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Developer Privilege Required (डेवलपर एक्सेस आवश्यक)</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The Archive Vault, Activity Audits, and 1-Click Restoration tools are strictly restricted to Lead Developers.
                </p>
                <button
                  onClick={() => navigateToTab('dashboard')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Return to Dashboard
                </button>
              </div>
            )
          )}

          {/* Dedicated Developer Access Screen */}
          {activeTab === 'developer-access' && (
            <DeveloperAccessView
              appSettings={appSettings}
              subjects={subjects}
              topics={topics}
              lectures={lectures}
              notes={notes}
              mcqs={mcqs}
              mockTests={mockTests}
              users={users}
              mockAttempts={mockAttempts}
              mcqAttempts={mcqAttempts}
              onNavigateTab={navigateToTab}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              topics={topics}
              onSelectSubjectTopics={(subId) => {
                setSelectedSubjectFilter(subId);
                navigateToTab('topics');
              }}
              openCreateModal={quickCreateType === 'subjects'}
              onCloseCreateModal={() => setQuickCreateType(null)}
            />
          )}

          {activeTab === 'topics' && (
            <TopicsView
              subjects={subjects}
              topics={topics}
              lectures={lectures}
              notes={notes}
              mcqs={mcqs}
              selectedSubjectFilter={selectedSubjectFilter}
              onSelectSubjectFilter={setSelectedSubjectFilter}
              openCreateModal={quickCreateType === 'topics'}
              onCloseCreateModal={() => setQuickCreateType(null)}
              onAddContentForTopic={(type, topicId, subjectId) => {
                if (subjectId) setSelectedSubjectFilter(subjectId);
                if (type === 'lecture') {
                  navigateToTab('lectures');
                  setQuickCreateType('lectures');
                } else if (type === 'note') {
                  navigateToTab('notes');
                  setQuickCreateType('notes');
                } else if (type === 'mcq') {
                  navigateToTab('mcqs');
                  setQuickCreateType('mcqs');
                }
              }}
            />
          )}

          {activeTab === 'lectures' && (
            <LecturesView
              subjects={subjects}
              topics={topics}
              lectures={lectures}
              defaultSubjectId={selectedSubjectFilter}
              openCreateModal={quickCreateType === 'lectures'}
              onCloseCreateModal={() => setQuickCreateType(null)}
            />
          )}

          {activeTab === 'notes' && (
            <NotesView
              subjects={subjects}
              topics={topics}
              notes={notes}
              defaultSubjectId={selectedSubjectFilter}
              openCreateModal={quickCreateType === 'notes'}
              onCloseCreateModal={() => setQuickCreateType(null)}
            />
          )}

          {activeTab === 'mcqs' && (
            <MCQsView
              subjects={subjects}
              topics={topics}
              mcqs={mcqs}
              appSettings={appSettings}
              defaultSubjectId={selectedSubjectFilter}
              openCreateModal={quickCreateType === 'mcqs'}
              onCloseCreateModal={() => setQuickCreateType(null)}
            />
          )}

          {activeTab === 'mocktests' && (
            <MockTestsView
              mockTests={mockTests}
              mcqs={mcqs}
              subjects={subjects}
              topics={topics}
              mockAttempts={mockAttempts}
              appSettings={appSettings}
              openCreateModal={quickCreateType === 'mocktests'}
              onCloseCreateModal={() => setQuickCreateType(null)}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              users={users}
              mockAttempts={mockAttempts}
              mcqAttempts={mcqAttempts}
            />
          )}

          {/* Master Developer Console: Remote User App Control, Theme & Code Injector */}
          {activeTab === 'dev-console' && (
            isDeveloper ? (
              <DeveloperConsoleView settings={appSettings} />
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Developer Privilege Required</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only authorized Lead Developers can modify remote application branding, live themes, or custom codes.
                </p>
                <button
                  onClick={() => navigateToTab('dashboard')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'firebase-sync' && (
            isDeveloper ? (
              <FirebaseSyncView />
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Access Restricted</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Firebase rules and database synchronization are restricted to Lead Developers.
                </p>
              </div>
            )
          )}

          {/* App Settings Management (Strictly Developer Only) */}
          {activeTab === 'settings' && (
            isDeveloper ? (
              <SettingsView
                appSettings={appSettings}
                onRefreshSettings={() => {}}
              />
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Developer Privilege Required (डेवलपर एक्सेस आवश्यक)</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  App settings, branding, advertisement banners, and API configurations are strictly restricted to Lead Developers.
                </p>
                <button
                  onClick={() => navigateToTab('dashboard')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Return to Dashboard
                </button>
              </div>
            )
          )}
        </main>
      </div>

      {/* Live Student App Emulator Companion Modal */}
      <StudentAppPreviewModal
        isOpen={isStudentPreviewOpen}
        onClose={closeStudentPreviewModal}
        subjects={subjects}
        topics={topics}
        lectures={lectures}
        notes={notes}
        mcqs={mcqs}
        mockTests={mockTests}
        appSettings={appSettings}
      />
    </div>
  );
};

export default App;

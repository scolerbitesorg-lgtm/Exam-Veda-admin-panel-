import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  Smartphone,
  AlertTriangle,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Zap,
  Terminal,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseLiveBadge } from '../common/DatabaseLiveBadge';
import type { AppSettings } from '../../types';

interface AdminNavbarProps {
  onToggleSidebarMobile: () => void;
  onOpenStudentPreview: () => void;
  onQuickAction: (action: 'subject' | 'topic' | 'lecture' | 'note' | 'mcq' | 'mock') => void;
  appSettings: AppSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onToggleSidebarMobile,
  onOpenStudentPreview,
  onQuickAction,
  appSettings,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, userProfile, logOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Maintenance alert warning if active */}
      {appSettings.maintenanceMode && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
            <span>
              <strong>MAINTENANCE MODE IS ENABLED:</strong> Students will see maintenance screen on the mobile app.
            </span>
          </div>
        </div>
      )}

      <div className="h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebarMobile}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects, topics, lectures, MCQs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition outline-hidden"
            />
          </div>
        </div>

        {/* Right: Quick actions & profile */}
        <div className="flex items-center gap-2.5">
          {/* Real-Time Database Connection Live / Unlive Status */}
          <DatabaseLiveBadge />

          {/* Live Mobile Student App button */}
          <button
            onClick={onOpenStudentPreview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Open real-time Student App view"
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span className="hidden md:inline">Student App View</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Content</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showQuickMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Create New
                  </div>
                  <button
                    onClick={() => {
                      onQuickAction('subject');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>📚 New Subject (विषय)</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('topic');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>📑 New Topic (अध्याय)</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('lecture');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>🎥 New Video Lecture</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('note');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>📝 New Note / PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('mcq');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>❓ New MCQ Question</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('mock');
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 flex items-center justify-between"
                  >
                    <span>⏱️ New Mock Test</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile / Login status */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition border border-slate-200/80"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs ${
                  userProfile?.role === 'developer'
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600'
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                }`}>
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {userProfile?.name || (userProfile?.role === 'developer' ? 'Lead Developer' : 'Content Admin')}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    {userProfile?.role === 'developer' ? (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                        Developer (A-Z)
                      </span>
                    ) : (
                      <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        Content Admin
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                Guest
              </span>
            )}

            {showProfileMenu && currentUser && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{userProfile?.name || 'Academic Administrator'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        userProfile?.role === 'developer'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-indigo-100 text-indigo-900'
                      }`}>
                        {userProfile?.role === 'developer' ? '👑 Lead Developer (Full Access)' : '📝 Content Manager'}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-2 border-b border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-700">Permissions:</div>
                    {userProfile?.role === 'developer' ? (
                      <p className="text-[10px] text-emerald-700">
                        ✓ App Settings, Firebase Bridge, Users, Courses, Notes, MCQs, Tests.
                      </p>
                    ) : (
                      <p className="text-[10px] text-indigo-700">
                        ✓ Subjects, Topics, Lectures, Notes, MCQs, Mock Tests (Settings Locked).
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logOut();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

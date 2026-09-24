import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Video,
  FileText,
  HelpCircle,
  Clock,
  Users,
  Bot,
  Settings,
  Smartphone,
  Sparkles,
  Database,
  ExternalLink,
  Flame,
  ShieldCheck,
  Shield,
  Code2,
  Sliders,
  X,
  Lock,
  Zap,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseLiveBadge } from '../common/DatabaseLiveBadge';
import type { AdminTab } from '../../types';
export type { AdminTab };

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  counts: {
    subjects: number;
    topics: number;
    lectures: number;
    notes: number;
    mcqs: number;
    mocktests: number;
    users: number;
  };
  onOpenStudentPreview: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  onOpenStudentPreview,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { isDeveloper, userProfile } = useAuth();

  const academicNavItems: {
    id: AdminTab;
    label: string;
    hindiLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', hindiLabel: 'डैशबोर्ड अवलोकन', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', hindiLabel: 'विषय प्रबंधन', icon: BookOpen, count: counts.subjects },
    { id: 'topics', label: 'Topics', hindiLabel: 'अध्याय एवं टॉपिक्स', icon: FolderTree, count: counts.topics },
    { id: 'lectures', label: 'Video Lectures', hindiLabel: 'वीडियो व्याख्यान', icon: Video, count: counts.lectures },
    { id: 'notes', label: 'Notes & PDFs', hindiLabel: 'नोट्स एवं पीडीएफ', icon: FileText, count: counts.notes },
    { id: 'mcqs', label: 'MCQs Bank', hindiLabel: 'प्रश्नोत्तरी बैंक', icon: HelpCircle, count: counts.mcqs },
    { id: 'mocktests', label: 'Mock Tests', hindiLabel: 'मॉक टेस्ट परीक्षा', icon: Clock, count: counts.mocktests },
    { id: 'users', label: isDeveloper ? 'Team & Students' : 'Student Submissions', hindiLabel: 'स्टाफ एवं छात्र रिकॉर्ड्स', icon: Users, count: counts.users },
  ];

  const devOnlyNavItems: {
    id: AdminTab;
    label: string;
    hindiLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    isNew?: boolean;
  }[] = [
    {
      id: 'developer-access',
      label: 'Developer Access',
      hindiLabel: 'एडवांस्ड डेवलपर टूल्स एवं न्यू फीचर्स',
      icon: Terminal,
      isNew: true,
    },
    { id: 'dev-console', label: 'Developer Remote Console', hindiLabel: 'यूजर ऐप थीम व कोड इंजेक्टर', icon: Code2 },
    { id: 'settings', label: 'Global App Settings', hindiLabel: 'सिस्टम सेटिंग्स', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                isDeveloper
                  ? 'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-200'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-200'
              }`}
            >
              {isDeveloper ? <Code2 className="w-5 h-5" /> : <span className="font-extrabold text-lg">EV</span>}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight">Edu Veda</span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                    isDeveloper
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                  }`}
                >
                  {isDeveloper ? 'Developer Master' : 'Admin'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {isDeveloper ? 'Full App & Remote Code Control' : 'Academic Uploads Only'}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Student App Preview Button Card */}
        <div className="px-4 py-3 bg-gradient-to-b from-indigo-50/60 to-purple-50/40 border-b border-indigo-100/60">
          <button
            onClick={() => {
              onOpenStudentPreview();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-sm shadow-indigo-300 font-medium text-xs transition group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-white/20 group-hover:scale-110 transition">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold leading-tight">User Mobile App Preview</div>
                <div className="text-[10px] text-indigo-100">Live companion emulator</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-200 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Section 1: Academic Management (For Both Admin & Dev) */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Academic Content Uploads (शैक्षणिक सामग्री)
            </div>
            {academicNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="text-left truncate">
                      <div className="truncate flex items-center gap-1.5">
                        <span>{item.label}</span>
                      </div>
                      <div className={`text-[10px] font-normal truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {item.hindiLabel}
                      </div>
                    </div>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Section 2: Master Developer Remote App Controls (Developer Only) */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-3 pb-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
              <span>Developer Remote Tools</span>
              {isDeveloper ? (
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                  UNLOCKED
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 flex items-center gap-0.5 font-mono">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </span>
              )}
            </div>

            {devOnlyNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              if (!isDeveloper) {
                return (
                  <div
                    key={item.id}
                    title="Developer-only master controller"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 opacity-60 cursor-not-allowed bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 text-slate-300" />
                      <div className="text-left truncate">
                        <div className="truncate font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.hindiLabel}</div>
                      </div>
                    </div>
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-200'
                      : 'text-slate-600 hover:bg-amber-50/50 hover:text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-600'}`} />
                    <div className="text-left truncate">
                      <div className="truncate flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.isNew && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 border border-amber-400 font-extrabold px-1 py-0.2 rounded-sm uppercase tracking-wide">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] font-normal truncate ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                        {item.hindiLabel}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Role & Real-Time Live Connection Card */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Database Sync</span>
            <DatabaseLiveBadge compact={false} />
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs">
            {isDeveloper ? (
              <Code2 className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <div className="truncate flex-1">
              <div className="font-extrabold text-slate-900 text-xs truncate">
                {isDeveloper ? 'Lead Developer' : 'Academic Admin'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {userProfile?.email || 'admin@eduveda.in'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

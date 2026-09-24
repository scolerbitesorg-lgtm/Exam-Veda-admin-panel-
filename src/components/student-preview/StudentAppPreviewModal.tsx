import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Home,
  FileText,
  Clock,
  Bot,
  Search,
  BookOpen,
  Folder,
  FolderTree,
  Video,
  Play,
  Pause,
  ChevronRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Send,
  Trash2,
  Smartphone,
  AlertTriangle,
  RotateCcw,
  Check,
  Award,
  Timer,
  Megaphone,
  ExternalLink,
} from 'lucide-react';
import type {
  Subject,
  Topic,
  Lecture,
  Note,
  MCQ,
  MockTest,
  AppSettings,
} from '../../types';
import { EduVedaVideoPlayer } from '../common/EduVedaVideoPlayer';
import { requestAI } from '../../services/aiProviderService';
import { DEFAULT_MCQ_THEME, DEFAULT_MOCK_TEST_THEME } from '../../config/quizThemes';
import { isAnnouncementActive, formatTimeRemaining } from '../../utils/announcementUtils';
import { updateAppSettings } from '../../services/dbService';

interface StudentAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  lectures: Lecture[];
  notes: Note[];
  mcqs: MCQ[];
  mockTests: MockTest[];
  appSettings: AppSettings;
}

type StudentScreen =
  | 'home'
  | 'subject-topics'
  | 'topic-detail'
  | 'lecture-player'
  | 'notes-list'
  | 'note-detail'
  | 'mcq-practice'
  | 'test'
  | 'mock-exam'
  | 'mock-result';

export const StudentAppPreviewModal: React.FC<StudentAppPreviewModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  lectures,
  notes,
  mcqs,
  mockTests,
  appSettings,
}) => {
  const [deviceWidth, setDeviceWidth] = useState<'375px' | '390px' | '430px'>('390px');
  const [activeBottomNav, setActiveBottomNav] = useState<'home' | 'notes' | 'test'>('home');
  const [currentScreen, setCurrentScreen] = useState<StudentScreen>('home');

  // Navigation state history
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedMock, setSelectedMock] = useState<MockTest | null>(null);

  // Search
  const [studentSearch, setStudentSearch] = useState('');

  // Audio / Sound toggle in header
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sub tab in Tests screen
  const [testSubTab, setTestSubTab] = useState<'mocktests' | 'topics'>('mocktests');

  // MCQ practice state
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);

  // Mock Exam State
  const [examCurrentIndex, setExamCurrentIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState(30 * 60);
  const [examTimerActive, setExamTimerActive] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResultStats, setExamResultStats] = useState({
    score: 0,
    total: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    percentage: 0,
    timeTaken: 0,
  });

  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Timer countdown for mock exam
  useEffect(() => {
    let interval: any = null;
    if (examTimerActive && examTimeRemaining > 0) {
      interval = setInterval(() => {
        setExamTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (examTimeRemaining === 0 && examTimerActive) {
      handleSubmitExam();
    }
    return () => clearInterval(interval);
  }, [examTimerActive, examTimeRemaining]);

  // Reactive announcement timer ticker so banner auto-hides instantly when time expires
  const [announcementLive, setAnnouncementLive] = useState(() => isAnnouncementActive(appSettings));
  const [announcementCountdownStr, setAnnouncementCountdownStr] = useState(() =>
    formatTimeRemaining(appSettings?.announcementExpiresAt).formatted
  );

  useEffect(() => {
    const updateAnnouncementStatus = () => {
      const active = isAnnouncementActive(appSettings);
      setAnnouncementLive(active);
      const remaining = formatTimeRemaining(appSettings?.announcementExpiresAt);
      setAnnouncementCountdownStr(remaining.formatted);

      // Auto-turn off showBanner in Firestore if expiration timestamp has elapsed
      if (!active && appSettings?.showBanner && appSettings?.announcementExpiresAt) {
        const expTime = new Date(appSettings.announcementExpiresAt).getTime();
        if (!isNaN(expTime) && expTime <= Date.now()) {
          updateAppSettings({ showBanner: false }).catch(() => {});
        }
      }
    };

    updateAnnouncementStatus();
    const ticker = setInterval(updateAnnouncementStatus, 1000);
    return () => clearInterval(ticker);
  }, [appSettings]);

  // Festive & Promotional Pop-Up Modal Broadcaster state
  const [popupBannerDismissed, setPopupBannerDismissed] = useState(false);
  const prevPopupEnabledRef = useRef<boolean | undefined>(appSettings?.popupBanner?.enabled);
  const prevPopupTitleRef = useRef<string | undefined>(appSettings?.popupBanner?.title);

  // If admin updates popup title or toggles enabled, reactivate the pop-up modal
  useEffect(() => {
    const isNowEnabled = appSettings?.popupBanner?.enabled ?? false;
    const currentTitle = appSettings?.popupBanner?.title || '';
    if (isNowEnabled && (!prevPopupEnabledRef.current || prevPopupTitleRef.current !== currentTitle)) {
      setPopupBannerDismissed(false);
    }
    prevPopupEnabledRef.current = isNowEnabled;
    prevPopupTitleRef.current = currentTitle;
  }, [appSettings?.popupBanner?.enabled, appSettings?.popupBanner?.title]);

  if (!isOpen) return null;

  // Filter published / live only for student app (published !== false ensures items default to live)
  const publishedSubjects = subjects.filter((s) => s.published !== false);
  const publishedTopics = topics.filter((t) => t.published !== false);
  const publishedLectures = lectures.filter((l) => l.published !== false);
  const publishedNotes = notes.filter((n) => n.published !== false);
  const publishedMCQs = mcqs.filter((m) => m.published !== false);
  const publishedMockTests = mockTests.filter((m) => m.published !== false);

  // Bottom Navigation Handlers
  const handleBottomNavClick = (tab: 'home' | 'notes' | 'test') => {
    setActiveBottomNav(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
      setSelectedSubject(null);
      setSelectedTopic(null);
    } else if (tab === 'notes') {
      setCurrentScreen('notes-list');
    } else if (tab === 'test') {
      setCurrentScreen('test');
    }
  };

  // Mock test start & submit
  const handleStartExam = (mock: MockTest) => {
    setSelectedMock(mock);
    setExamCurrentIndex(0);
    setExamAnswers({});
    setExamTimeRemaining((mock.duration || 30) * 60);
    setExamTimerActive(true);
    setExamSubmitted(false);
    setCurrentScreen('mock-exam');
  };

  const handleSelectExamOption = (questionId: string, optionIdx: number) => {
    setExamAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitExam = () => {
    if (!selectedMock) return;
    setExamTimerActive(false);

    const testMCQs = publishedMCQs.filter((m) => selectedMock.questionIds?.includes(m.id));
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    testMCQs.forEach((m) => {
      const selected = examAnswers[m.id];
      if (selected === undefined) {
        skipped++;
      } else if (selected === m.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const score = correct;
    const total = testMCQs.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;
    const timeTaken = (selectedMock.duration || 30) * 60 - examTimeRemaining;

    setExamResultStats({
      score,
      total,
      correct,
      wrong,
      skipped,
      percentage,
      timeTaken,
    });
    setExamSubmitted(true);
    setCurrentScreen('mock-result');
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      {/* Container */}
      <div className="relative flex flex-col items-center max-h-[96vh]">
        {/* Top Control Bar for Admin */}
        <div className="mb-2 w-full flex items-center justify-between text-xs text-white px-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold flex items-center gap-1.5 text-indigo-300">
              <Smartphone className="w-4 h-4" />
              Live Student Mobile Emulator
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-[10px] font-mono font-bold">
              {(['375px', '390px', '430px'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setDeviceWidth(w)}
                  className={`px-2 py-0.5 rounded transition ${
                    deviceWidth === w ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Device Frame */}
        <div
          style={{ width: deviceWidth }}
          className="h-[780px] max-h-[88vh] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col relative select-none"
        >
          {/* Top Notch / Camera Island */}
          <div className="w-full bg-slate-900 pt-2 pb-1 px-6 flex items-center justify-between text-[11px] text-white font-mono shrink-0">
            <span>09:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <span>5G 100%</span>
          </div>

          {/* Maintenance Mode Screen (Master Spec requirement) */}
          {appSettings.maintenanceMode ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="font-extrabold text-slate-900 text-base">Under Maintenance</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                {appSettings.maintenanceMessage ||
                  'Edu Veda is currently undergoing scheduled maintenance. Please check back shortly.'}
              </p>
              <span className="mt-4 text-[10px] font-mono text-slate-400">Version {appSettings.version}</span>
            </div>
          ) : (
            <>
              {/* App Header (Clean white header with Edu Veda logo, cloud sync, sound, profile) */}
              <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-2xs">
                {currentScreen !== 'home' ? (
                  <button
                    onClick={() => {
                      if (currentScreen === 'mock-exam' && !examSubmitted) {
                        if (confirm('Leave mock test? Time is running.')) {
                          setExamTimerActive(false);
                          setCurrentScreen('test');
                        }
                      } else {
                        setCurrentScreen('home');
                        setSelectedSubject(null);
                        setSelectedTopic(null);
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    {appSettings.logo ? (
                      <img
                        src={appSettings.logo}
                        alt="Logo"
                        className="w-8 h-8 rounded-xl object-contain bg-white border border-slate-200 shadow-2xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                        EV
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs tracking-tight">
                        {appSettings.appName || 'Edu Veda'}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">
                        {appSettings.tagline || 'शिक्षा का महामंच'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cloud Sync</span>
                  </div>

                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                    title={soundEnabled ? 'Mute' : 'Unmute'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center">
                    U
                  </div>
                </div>
              </div>

              {/* Main Content Area (Scrollable with bottom padding for bottom navigation) */}
              <div className="flex-1 overflow-y-auto pb-20 bg-slate-50/50">
                {/* 1. SCREEN: HOME */}
                {currentScreen === 'home' && (
                  <div className="p-4 space-y-4">
                    {/* Welcome Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-sm space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                        <Sparkles className="w-3 h-3" />
                        <span>Daily Practice & Foundation</span>
                      </div>
                      <h2 className="font-extrabold text-sm">नमस्ते Student, Ready to Learn?</h2>
                      <p className="text-[11px] text-indigo-100">
                        {appSettings.tagline || 'भारत का अग्रणी डिजिटल शिक्षा मंच'}
                      </p>
                    </div>

                    {/* Announcement Banner if active and not expired */}
                    {announcementLive && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 text-xs shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Official Announcement
                          </span>
                          {appSettings.announcementExpiresAt && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 flex items-center gap-1">
                              <Timer className="w-2.5 h-2.5" />
                              {announcementCountdownStr}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed">
                          {appSettings.bannerNotice}
                        </p>
                      </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search subjects, topics, lectures, notes..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs focus:border-indigo-400 outline-hidden"
                      />
                    </div>

                    {/* Quick Action Buttons (Subjects, Mock Tests, Topic MCQs, Notes) */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {}}
                        className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 flex flex-col items-center justify-center text-center transition"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">Subjects</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentScreen('test');
                          setTestSubTab('mocktests');
                        }}
                        className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 flex flex-col items-center justify-center text-center transition"
                      >
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">Mock Tests</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentScreen('test');
                          setTestSubTab('topics');
                        }}
                        className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-amber-300 flex flex-col items-center justify-center text-center transition"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">Topic MCQs</span>
                      </button>

                      <button
                        onClick={() => setCurrentScreen('notes-list')}
                        className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 flex flex-col items-center justify-center text-center transition"
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">Notes</span>
                      </button>
                    </div>

                    {/* Subjects Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                          All Subjects (सभी विषय)
                        </h3>
                        <span className="text-[10px] text-indigo-600 font-bold">
                          {publishedSubjects.length} Courses
                        </span>
                      </div>

                      {publishedSubjects.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No subjects available</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Admin has not published any subjects yet.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {publishedSubjects
                            .filter(
                              (s) =>
                                !studentSearch ||
                                s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                (s.hindiName || '').includes(studentSearch)
                            )
                            .map((sub) => {
                              const count = publishedTopics.filter((t) => t.subjectId === sub.id).length;
                              const themeColor = sub.color || '#6366f1';
                              return (
                                <div
                                  key={sub.id}
                                  onClick={() => {
                                    setSelectedSubject(sub);
                                    setCurrentScreen('subject-topics');
                                  }}
                                  className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between overflow-hidden"
                                >
                                  <div>
                                    <div
                                      className="p-3.5 flex items-center justify-between"
                                      style={{
                                        background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}25)`,
                                        borderBottom: `1px solid ${themeColor}20`,
                                      }}
                                    >
                                      <div
                                        className="w-10 h-10 rounded-xl border border-white shadow-xs flex items-center justify-center text-xl"
                                        style={{ backgroundColor: themeColor }}
                                      >
                                        <span>{sub.icon || '📚'}</span>
                                      </div>
                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 text-slate-700">
                                        #{sub.order}
                                      </span>
                                    </div>
                                    <div className="p-3 pt-2.5">
                                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2">
                                        {sub.name}
                                      </h4>
                                      {sub.hindiName && (
                                        <p className="text-[10px] text-indigo-700 font-bold truncate mt-0.5">
                                          {sub.hindiName}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>{count} Topics</span>
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SCREEN: SUBJECT TOPICS */}
                {currentScreen === 'subject-topics' && selectedSubject && (
                  <div className="p-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: selectedSubject.color || '#6366f1' }}
                      >
                        <span>{selectedSubject.icon || '📚'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold uppercase text-indigo-600">Course Syllabus</div>
                        <h2 className="text-sm font-extrabold text-slate-900">{selectedSubject.name}</h2>
                        {selectedSubject.hindiName && (
                          <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                            {selectedSubject.hindiName}
                          </p>
                        )}
                        {selectedSubject.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {selectedSubject.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-xs">Chapters & Topics</h3>
                      {publishedTopics
                        .filter((t) => t.subjectId === selectedSubject.id)
                        .map((top) => {
                          const topLectures = publishedLectures.filter((l) => l.topicId === top.id).length;
                          const topNotes = publishedNotes.filter((n) => n.topicId === top.id).length;
                          const topMCQs = publishedMCQs.filter((m) => m.topicId === top.id).length;

                          return (
                            <div
                              key={top.id}
                              onClick={() => {
                                setSelectedTopic(top);
                                setCurrentScreen('topic-detail');
                              }}
                              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-2xs transition cursor-pointer flex items-center justify-between gap-3"
                            >
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
                                <span>{top.icon || '📂'}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                                  {top.title}
                                </h4>
                                {top.hindiTitle && (
                                  <p className="text-[10px] text-indigo-700 font-bold mt-0.5 truncate">
                                    {top.hindiTitle}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-semibold">
                                  <span>{topLectures} Lectures</span>
                                  <span>•</span>
                                  <span>{topNotes} Notes</span>
                                  <span>•</span>
                                  <span>{topMCQs} MCQs</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 3. SCREEN: TOPIC DETAIL (Lectures / Notes / MCQs) */}
                {currentScreen === 'topic-detail' && selectedTopic && (
                  <div className="p-4 space-y-4">
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
                        <span>{selectedTopic.icon || '📂'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600">Chapter Module</span>
                        <h2 className="font-extrabold text-sm text-slate-900">{selectedTopic.title}</h2>
                        {selectedTopic.hindiTitle && (
                          <p className="text-xs text-indigo-700 font-medium">{selectedTopic.hindiTitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Lectures under topic */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-sky-600" />
                          Video Lectures
                        </span>
                      </div>
                      {publishedLectures.filter((l) => l.topicId === selectedTopic.id).length === 0 ? (
                        <div className="p-3 rounded-xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          No lectures published for this topic.
                        </div>
                      ) : (
                        publishedLectures
                          .filter((l) => l.topicId === selectedTopic.id)
                          .map((lec) => (
                            <div
                              key={lec.id}
                              onClick={() => {
                                setSelectedLecture(lec);
                                setCurrentScreen('lecture-player');
                              }}
                              className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition cursor-pointer flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl shrink-0">
                                <span>{lec.icon || '🎬'}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">{lec.title}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                  <span>⏱ {lec.duration || '20:00'}</span>
                                  {lec.instructor && <span>• {lec.instructor}</span>}
                                </div>
                              </div>
                              <Play className="w-4 h-4 text-indigo-600 fill-current ml-auto shrink-0" />
                            </div>
                          ))
                      )}
                    </div>

                    {/* Notes under topic */}
                    <div className="space-y-2 pt-2">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        Revision Notes & PDFs
                      </span>
                      {publishedNotes.filter((n) => n.topicId === selectedTopic.id).length === 0 ? (
                        <div className="p-3 rounded-xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          No notes published for this topic.
                        </div>
                      ) : (
                        publishedNotes
                          .filter((n) => n.topicId === selectedTopic.id)
                          .map((note) => (
                            <div
                              key={note.id}
                              onClick={() => {
                                setSelectedNote(note);
                                setCurrentScreen('note-detail');
                              }}
                              className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                    note.type === 'pdf'
                                      ? 'bg-rose-50 border border-rose-100'
                                      : 'bg-indigo-50 border border-indigo-100'
                                  }`}
                                >
                                  <span>{note.icon || (note.type === 'pdf' ? '📄' : '📝')}</span>
                                </div>
                                <div className="truncate">
                                  <div className="font-bold text-xs text-slate-900 truncate">{note.title}</div>
                                  {note.hindiTitle ? (
                                    <div className="text-[10px] text-indigo-700 font-semibold truncate">{note.hindiTitle}</div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 capitalize">{note.type === 'pdf' ? `${note.pageCount || 10} Pages PDF` : 'Revision note'}</div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>
                          ))
                      )}
                    </div>

                    {/* MCQ Practice Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setCurrentMCQIndex(0);
                          setSelectedOption(null);
                          setShowExplanation(false);
                          setMcqScore(0);
                          setCurrentScreen('mcq-practice');
                        }}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Start MCQ Practice Quiz ({publishedMCQs.filter((m) => m.topicId === selectedTopic.id).length} Qs)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. SCREEN: LECTURE PLAYER */}
                {currentScreen === 'lecture-player' && selectedLecture && (
                  <div className="p-4 space-y-4">
                    <EduVedaVideoPlayer
                      videoUrl={selectedLecture.videoUrl}
                      title={selectedLecture.title}
                      poster={selectedLecture.thumbnail}
                      autoPlay
                    />

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-indigo-600">Lecture Video</span>
                      <h2 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {selectedLecture.title}
                      </h2>
                      <div className="text-xs text-slate-500 leading-relaxed font-sans">
                        {selectedLecture.description || 'Comprehensive video explanation.'}
                      </div>
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        Instructor: {selectedLecture.instructor || 'Edu Veda Faculty'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SCREEN: NOTE DETAIL */}
                {currentScreen === 'note-detail' && selectedNote && (
                  <div className="p-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
                        <span>{selectedNote.icon || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {selectedNote.type.toUpperCase()} Note
                        </span>
                        <h2 className="font-extrabold text-sm text-slate-900 mt-1">{selectedNote.title}</h2>
                        {selectedNote.hindiTitle && (
                          <p className="text-xs text-indigo-700 font-semibold mt-0.5">{selectedNote.hindiTitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedNote.type === 'pdf' ? (
                        <div className="text-center py-6 space-y-3">
                          <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                          <p className="font-bold text-slate-800">PDF Document Ready ({selectedNote.pageCount || 10} Pages)</p>
                          <a
                            href={selectedNote.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200"
                          >
                            Open / Download PDF File
                          </a>
                        </div>
                      ) : (
                        selectedNote.content
                      )}
                    </div>
                  </div>
                )}

                {/* 6. SCREEN: MCQ PRACTICE */}
                {currentScreen === 'mcq-practice' && selectedTopic && (
                  <div className="p-4 space-y-4">
                    {(() => {
                      const topicMCQs = publishedMCQs.filter((m) => m.topicId === selectedTopic.id);
                      if (topicMCQs.length === 0) {
                        return (
                          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-4">
                            <p className="text-xs font-bold text-slate-700">No MCQs published for this topic yet</p>
                          </div>
                        );
                      }

                      const currentMCQ = topicMCQs[currentMCQIndex];
                      const mcqTheme = appSettings.mcqTheme || DEFAULT_MCQ_THEME;

                      return (
                        <div
                          className="space-y-4"
                          style={{ fontFamily: mcqTheme.fontFamily }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-xs"
                              style={{ backgroundColor: mcqTheme.questionBadgeColor }}
                            >
                              Question {currentMCQIndex + 1} of {topicMCQs.length}
                            </span>
                            <span
                              className="font-extrabold text-xs"
                              style={{ color: mcqTheme.primaryColor }}
                            >
                              Score: {mcqScore}
                            </span>
                          </div>

                          <div
                            className="p-4 border shadow-2xs space-y-2"
                            style={{
                              backgroundColor: mcqTheme.cardBackgroundColor,
                              borderRadius: mcqTheme.borderRadius,
                              borderColor: '#e2e8f0',
                            }}
                          >
                            <h3
                              className="font-extrabold text-xs leading-snug"
                              style={{ color: mcqTheme.textColor }}
                            >
                              {currentMCQ.question}
                            </h3>
                            {currentMCQ.hindiQuestion && (
                              <p
                                className="text-xs font-semibold mt-1 font-sans"
                                style={{ color: mcqTheme.primaryColor }}
                              >
                                {currentMCQ.hindiQuestion}
                              </p>
                            )}
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            {currentMCQ.options.map((opt, i) => {
                              const isSelected = selectedOption === i;
                              const isCorrect = currentMCQ.correctAnswer === i;

                              let optBg = '#ffffff';
                              let optBorder = '#e2e8f0';
                              let optTextColor = '#1e293b';

                              if (showExplanation) {
                                if (isCorrect) {
                                  optBg = mcqTheme.correctOptionBg;
                                  optBorder = mcqTheme.correctOptionBorder;
                                  optTextColor = '#065f46';
                                } else if (isSelected) {
                                  optBg = mcqTheme.wrongOptionBg;
                                  optBorder = mcqTheme.wrongOptionBorder;
                                  optTextColor = '#991b1b';
                                }
                              } else if (isSelected) {
                                optBg = mcqTheme.selectedOptionBg;
                                optBorder = mcqTheme.selectedOptionBorder;
                                optTextColor = '#1e1b4b';
                              }

                              return (
                                <button
                                  key={i}
                                  disabled={showExplanation}
                                  onClick={() => {
                                    setSelectedOption(i);
                                    setShowExplanation(true);
                                    if (i === currentMCQ.correctAnswer) {
                                      setMcqScore((s) => s + 1);
                                    }
                                  }}
                                  className="w-full text-left p-3 border text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                                  style={{
                                    backgroundColor: optBg,
                                    borderColor: optBorder,
                                    borderRadius: mcqTheme.borderRadius,
                                    color: optTextColor,
                                  }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                      style={{
                                        backgroundColor: isSelected ? mcqTheme.primaryColor : '#f1f5f9',
                                        color: isSelected ? '#ffffff' : '#475569',
                                      }}
                                    >
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="font-semibold text-[11px]">{opt}</span>
                                  </div>
                                  {showExplanation && isCorrect && (
                                    <CheckCircle2
                                      className="w-4 h-4 shrink-0"
                                      style={{ color: mcqTheme.correctOptionBorder }}
                                    />
                                  )}
                                  {showExplanation && isSelected && !isCorrect && (
                                    <XCircle
                                      className="w-4 h-4 shrink-0"
                                      style={{ color: mcqTheme.wrongOptionBorder }}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Card */}
                          {showExplanation && (
                            <div
                              className="p-3.5 border text-xs space-y-1 shadow-2xs"
                              style={{
                                backgroundColor: mcqTheme.explanationBg,
                                borderColor: mcqTheme.accentColor + '50',
                                borderRadius: mcqTheme.borderRadius,
                              }}
                            >
                              <span
                                className="font-extrabold text-[10px] uppercase tracking-wider block"
                                style={{ color: mcqTheme.primaryColor }}
                              >
                                💡 Explanation & Solution:
                              </span>
                              <p className="text-slate-800 font-sans leading-relaxed text-[11px]">
                                {currentMCQ.explanation}
                              </p>
                            </div>
                          )}

                          {/* Next Question Button */}
                          {showExplanation && (
                            <button
                              onClick={() => {
                                if (currentMCQIndex + 1 < topicMCQs.length) {
                                  setCurrentMCQIndex((idx) => idx + 1);
                                  setSelectedOption(null);
                                  setShowExplanation(false);
                                } else {
                                  alert(`Quiz Completed! Final Score: ${mcqScore} / ${topicMCQs.length}`);
                                  setCurrentScreen('topic-detail');
                                }
                              }}
                              className="w-full py-2.5 font-bold text-xs shadow-md transition cursor-pointer active:scale-98"
                              style={{
                                backgroundColor: mcqTheme.actionButtonBg,
                                color: mcqTheme.actionButtonText,
                                borderRadius: mcqTheme.borderRadius,
                              }}
                            >
                              {currentMCQIndex + 1 < topicMCQs.length ? 'Next Question →' : 'Finish Quiz'}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 7. SCREEN: NOTES LIST TAB */}
                {currentScreen === 'notes-list' && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                        Study Notes & E-Books (नोट्स)
                      </h2>
                      <span className="text-[10px] text-indigo-600 font-bold">
                        {publishedNotes.length} Items
                      </span>
                    </div>

                    <div className="space-y-3">
                      {publishedNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => {
                            setSelectedNote(note);
                            setCurrentScreen('note-detail');
                          }}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                note.type === 'pdf'
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {note.type === 'pdf' ? 'PDF' : 'DOC'}
                            </div>
                            <div className="truncate">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                {note.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 capitalize">
                                {note.type === 'pdf' ? `${note.pageCount || 10} Pages E-Book` : 'Formatted Text Note'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. SCREEN: TEST TAB (Mock Tests & Topic Wise Folders) */}
                {currentScreen === 'test' && (
                  <div className="p-4 space-y-4">
                    {/* Switcher between Mock Tests and Topic Folders */}
                    <div className="p-1 rounded-2xl bg-slate-200/70 grid grid-cols-2 gap-1 text-xs font-bold">
                      <button
                        onClick={() => setTestSubTab('mocktests')}
                        className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                          testSubTab === 'mocktests'
                            ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Mock Tests ({publishedMockTests.length})</span>
                      </button>

                      <button
                        onClick={() => setTestSubTab('topics')}
                        className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
                          testSubTab === 'topics'
                            ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>Topic MCQs Folders</span>
                      </button>
                    </div>

                    {testSubTab === 'mocktests' ? (
                      <div className="space-y-3">
                        {publishedMockTests.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-4">
                            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No mock tests published yet</p>
                          </div>
                        ) : (
                          publishedMockTests.map((mock) => (
                            <div
                              key={mock.id}
                              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-purple-700 font-bold mb-1">
                                  <span>⏱️ {mock.durationMinutes || mock.duration || 30} Minutes</span>
                                  <span>Total Marks: {mock.totalMarks || mock.questionIds?.length || 20}</span>
                                </div>
                                <h3 className="font-extrabold text-xs text-slate-900 leading-snug">
                                  {mock.title}
                                </h3>
                                {mock.hindiTitle && (
                                  <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
                                    {mock.hindiTitle}
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                  {mock.description}
                                </p>
                              </div>

                              <button
                                onClick={() => handleStartExam(mock)}
                                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                              >
                                <span>Start Mock Test Now</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      /* TOPIC WISE MCQs FOLDERS (User requirement: History 20 MCQ folder type) */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Topic-wise Practice Banks</span>
                          <span className="text-[10px] text-amber-700 font-bold">
                            {publishedMCQs.length} Total MCQs
                          </span>
                        </div>

                        {publishedTopics.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-4">
                            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No topics available</p>
                          </div>
                        ) : (
                          publishedTopics.map((top) => {
                            const sub = publishedSubjects.find((s) => s.id === top.subjectId);
                            const count = publishedMCQs.filter((m) => m.topicId === top.id).length;

                            return (
                              <div
                                key={top.id}
                                onClick={() => {
                                  if (count > 0) {
                                    setSelectedTopic(top);
                                    setCurrentMCQIndex(0);
                                    setSelectedOption(null);
                                    setShowExplanation(false);
                                    setMcqScore(0);
                                    setCurrentScreen('mcq-practice');
                                  }
                                }}
                                className={`p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs transition flex items-center justify-between gap-3 ${
                                  count > 0
                                    ? 'hover:border-amber-400 cursor-pointer active:scale-98'
                                    : 'opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base shrink-0 font-bold">
                                    📁
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-bold">
                                        {sub?.icon || '📚'} {sub?.name || 'Subject'}
                                      </span>
                                    </div>
                                    <h4 className="font-extrabold text-xs text-slate-900 truncate mt-0.5">
                                      {top.title || top.name}
                                    </h4>
                                    {(top.hindiTitle || top.hindiName) && (
                                      <p className="text-[10px] text-amber-700 font-medium truncate">
                                        {top.hindiTitle || top.hindiName}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                      count > 0
                                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {count} MCQs
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 9. SCREEN: MOCK EXAM LIVE */}
                {currentScreen === 'mock-exam' && selectedMock && (
                  <div className="p-4 space-y-4">
                    {(() => {
                      const testMCQs = publishedMCQs.filter((m) =>
                        selectedMock.questionIds?.includes(m.id)
                      );
                      const mockTheme = appSettings.mockTestTheme || DEFAULT_MOCK_TEST_THEME;
                      const q = testMCQs[examCurrentIndex];
                      if (!q) return <div className="text-center py-8 text-xs font-bold text-slate-500">No questions found for this test.</div>;

                      const selectedIdx = examAnswers[q.id];

                      return (
                        <div
                          className="space-y-4"
                          style={{ fontFamily: mockTheme.fontFamily }}
                        >
                          {/* Exam Header with countdown timer */}
                          <div
                            className="p-3 shadow-md flex items-center justify-between"
                            style={{
                              backgroundColor: mockTheme.headerBgColor,
                              color: mockTheme.headerTextColor,
                              borderRadius: mockTheme.borderRadius,
                            }}
                          >
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                                Time Remaining
                              </div>
                              <div
                                className="font-mono text-sm font-extrabold"
                                style={{ color: mockTheme.timerColor }}
                              >
                                {formatTimer(examTimeRemaining)}
                              </div>
                            </div>

                            <button
                              onClick={handleSubmitExam}
                              className="px-3.5 py-1.5 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer text-white"
                              style={{
                                backgroundColor: mockTheme.submitButtonColor,
                                borderRadius: mockTheme.borderRadius,
                              }}
                            >
                              Submit Test
                            </button>
                          </div>

                          {/* NTA Question Status Palette bar */}
                          {mockTheme.showQuestionPalette !== false && (
                            <div className="p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                <span>Question Palette ({testMCQs.length})</span>
                                <span className="text-[9px] text-slate-500">
                                  {Object.keys(examAnswers).length} / {testMCQs.length} Answered
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {testMCQs.map((item, idx) => {
                                  const isAns = examAnswers[item.id] !== undefined;
                                  const isCurrent = examCurrentIndex === idx;

                                  let bg = mockTheme.notVisitedColor;
                                  if (isAns) bg = mockTheme.answeredColor;
                                  else if (idx <= examCurrentIndex) bg = mockTheme.unansweredColor;

                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => setExamCurrentIndex(idx)}
                                      className={`w-6 h-6 rounded-lg text-[10px] font-black text-white flex items-center justify-center transition cursor-pointer ${
                                        isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 scale-110' : 'opacity-90'
                                      }`}
                                      style={{ backgroundColor: bg }}
                                      title={`Question ${idx + 1}`}
                                    >
                                      {idx + 1}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Question Card */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                                style={{ backgroundColor: mockTheme.primaryColor }}
                              >
                                Q{examCurrentIndex + 1} of {testMCQs.length}
                              </span>
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: mockTheme.answeredColor }}
                              >
                                ✓ Answered: {Object.keys(examAnswers).length}
                              </span>
                            </div>

                            <div
                              className="p-4 border shadow-2xs"
                              style={{
                                backgroundColor: mockTheme.cardBackgroundColor,
                                borderRadius: mockTheme.borderRadius,
                                borderColor: '#e2e8f0',
                              }}
                            >
                              <h3
                                className="font-extrabold text-xs leading-snug"
                                style={{ color: mockTheme.textColor }}
                              >
                                {q.question}
                              </h3>
                              {q.hindiQuestion && (
                                <p
                                  className="text-xs font-semibold mt-1 font-sans"
                                  style={{ color: mockTheme.primaryColor }}
                                >
                                  {q.hindiQuestion}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              {q.options.map((opt, i) => {
                                const isSelected = selectedIdx === i;
                                return (
                                  <button
                                    key={i}
                                    onClick={() => handleSelectExamOption(q.id, i)}
                                    className="w-full text-left p-3 border text-xs flex items-center gap-2.5 transition cursor-pointer shadow-2xs"
                                    style={{
                                      backgroundColor: isSelected ? mockTheme.primaryColor + '15' : '#ffffff',
                                      borderColor: isSelected ? mockTheme.activeQuestionBorder : '#e2e8f0',
                                      borderRadius: mockTheme.borderRadius,
                                      color: isSelected ? '#0f172a' : '#334155',
                                      fontWeight: isSelected ? 700 : 500,
                                    }}
                                  >
                                    <span
                                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                                      style={{
                                        backgroundColor: isSelected ? mockTheme.primaryColor : '#f1f5f9',
                                        color: isSelected ? '#ffffff' : '#475569',
                                      }}
                                    >
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Question nav buttons */}
                            <div className="flex items-center justify-between pt-2">
                              <button
                                disabled={examCurrentIndex === 0}
                                onClick={() => setExamCurrentIndex((idx) => idx - 1)}
                                className="px-3.5 py-1.5 border border-slate-300 text-xs font-bold disabled:opacity-40 cursor-pointer bg-white"
                                style={{ borderRadius: mockTheme.borderRadius }}
                              >
                                ← Previous
                              </button>

                              <button
                                disabled={examCurrentIndex + 1 === testMCQs.length}
                                onClick={() => setExamCurrentIndex((idx) => idx + 1)}
                                className="px-3.5 py-1.5 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                                style={{
                                  backgroundColor: mockTheme.primaryColor,
                                  borderRadius: mockTheme.borderRadius,
                                }}
                              >
                                Next Question →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 10. SCREEN: MOCK RESULT & ANALYSIS */}
                {currentScreen === 'mock-result' && (
                  <div className="p-4 space-y-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Award className="w-6 h-6" />
                      </div>
                      <h2 className="font-extrabold text-base text-slate-900">Exam Submitted!</h2>
                      <div className="text-2xl font-black text-indigo-600">
                        {examResultStats.score} / {examResultStats.total}
                      </div>
                      <div className="text-xs font-bold text-slate-600">
                        Percentage: {Math.round(examResultStats.percentage)}%
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[10px] font-bold text-emerald-700">Correct</div>
                        <div className="font-extrabold text-emerald-900">{examResultStats.correct}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                        <div className="text-[10px] font-bold text-rose-700">Wrong</div>
                        <div className="font-extrabold text-rose-900">{examResultStats.wrong}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-600">Skipped</div>
                        <div className="font-extrabold text-slate-800">{examResultStats.skipped}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentScreen('test')}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                    >
                      Return to Tests
                    </button>
                  </div>
                )}
              </div>

              {/* Exact Clean Bottom Navigation: Home, Notes, Test */}
              <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2.5 px-6 flex items-center justify-around z-20 shadow-lg">
                <button
                  onClick={() => handleBottomNavClick('home')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
                    activeBottomNav === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => handleBottomNavClick('notes')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
                    activeBottomNav === 'notes' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Notes</span>
                </button>

                <button
                  onClick={() => handleBottomNavClick('test')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
                    activeBottomNav === 'test' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span>Test</span>
                </button>
              </div>

              {/* In-App Broadcast Pop-Up Modal (Live Admin Broadcast) */}
              {!popupBannerDismissed && appSettings.popupBanner?.enabled && (
                <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="w-full max-w-[320px] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setPopupBannerDismissed(true)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                      title="Dismiss Broadcast"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Badge / Tagline */}
                    {appSettings.popupBanner.badgeText && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>{appSettings.popupBanner.badgeText}</span>
                      </div>
                    )}

                    {/* Pop-up Image */}
                    {appSettings.popupBanner.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-h-40">
                        <img
                          src={appSettings.popupBanner.imageUrl}
                          alt={appSettings.popupBanner.title || 'Broadcast Pop-up'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Title & Subtitle */}
                    <div className="space-y-1.5 px-1">
                      <h3 className="font-black text-slate-900 text-base leading-snug">
                        {appSettings.popupBanner.title || 'Special Announcement'}
                      </h3>
                      {appSettings.popupBanner.subtitle && (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {appSettings.popupBanner.subtitle}
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPopupBannerDismissed(true);
                          const actionUrl = appSettings.popupBanner?.actionUrl || 'tab:courses';
                          if (actionUrl === 'tab:courses') {
                            handleBottomNavClick('home');
                          } else if (actionUrl === 'tab:mocktests') {
                            handleBottomNavClick('test');
                            setTestSubTab('mocktests');
                          } else if (actionUrl === 'tab:downloads' || actionUrl === 'tab:notes') {
                            handleBottomNavClick('notes');
                          } else if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
                            window.open(actionUrl, '_blank');
                          } else {
                            handleBottomNavClick('home');
                          }
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{appSettings.popupBanner.actionText || 'Enroll Now / देखें'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPopupBannerDismissed(true)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer block mx-auto py-0.5"
                      >
                        शायद बाद में (Dismiss / Later)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

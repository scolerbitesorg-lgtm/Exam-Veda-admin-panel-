import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Award,
  Users,
  Timer,
  X,
  FileCheck,
  Check,
  Shuffle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Zap,
  HelpCircle,
  Search,
  Palette,
} from 'lucide-react';
import {
  addMockTest,
  updateMockTest,
  deleteMockTest,
  deleteMockTestsBySubject,
  deleteAllMockTests,
} from '../../services/dbService';
import type { MockTest, MCQ, MockAttempt, Subject, Topic, AppSettings } from '../../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RandomMockGeneratorModal } from './RandomMockGeneratorModal';
import { BulkImportMockTestModal } from './BulkImportMockTestModal';
import { BulkImportMockTestsModal } from './BulkImportMockTestsModal';
import { QuizThemeSettingsModal } from './QuizThemeSettingsModal';

interface MockTestsViewProps {
  mockTests: MockTest[];
  mcqs: MCQ[];
  subjects?: Subject[];
  topics?: Topic[];
  mockAttempts: MockAttempt[];
  appSettings?: AppSettings;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  onRefreshSettings?: () => void;
}

export const MockTestsView: React.FC<MockTestsViewProps> = ({
  mockTests,
  mcqs,
  subjects = [],
  topics = [],
  mockAttempts,
  appSettings,
  openCreateModal = false,
  onCloseCreateModal,
  onRefreshSettings,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(openCreateModal);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isMultiBulkOpen, setIsMultiBulkOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [editingMock, setEditingMock] = useState<MockTest | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Form State for Manual Creation / Edit
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [duration, setDuration] = useState<number>(30); // in minutes
  const [totalMarks, setTotalMarks] = useState<number>(20);
  const [passingMarks, setPassingMarks] = useState<number>(10);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.33);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOldInSubjectBeforeAdd, setDeleteOldInSubjectBeforeAdd] = useState(false);

  // Existing mock tests in selected subject
  const existingMocksInSelectedSubject = mockTests.filter(
    (m) => m.subjectId === selectedSubjectId
  );

  // MCQ Selection Filter in Modal
  const [modalSubjectFilter, setModalSubjectFilter] = useState('');
  const [modalMCQSearch, setModalMCQSearch] = useState('');

  const openAddModal = () => {
    setEditingMock(null);
    setDeleteOldInSubjectBeforeAdd(false);
    setTitle('');
    setHindiTitle('');
    setDescription('Comprehensive examination simulation testing core syllabus concepts with strict time and negative marking.');
    setSelectedSubjectId(subjects[0]?.id || '');
    setDuration(30);
    setTotalMarks(20);
    setPassingMarks(8);
    setNegativeMarking(0.33);
    setSelectedQuestionIds([]);
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (mock: MockTest) => {
    setEditingMock(mock);
    setDeleteOldInSubjectBeforeAdd(false);
    setTitle(mock.title);
    setHindiTitle(mock.hindiTitle || '');
    setDescription(mock.description || '');
    setSelectedSubjectId(mock.subjectId || '');
    setDuration(mock.durationMinutes || mock.duration || 30);
    setTotalMarks(mock.totalMarks || (mock.questionIds?.length || 10));
    setPassingMarks(mock.passingMarks || Math.ceil((mock.totalMarks || 10) * 0.4));
    setNegativeMarking(mock.negativeMarking || 0);
    setSelectedQuestionIds(mock.questionIds || []);
    setPublished(mock.published ?? true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingMock(null);
    setDeleteOldInSubjectBeforeAdd(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleQuickPurgeSubjectMocks = async () => {
    if (!selectedSubjectId) return;
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    const subName = sub?.name || 'इस विषय';
    if (
      !window.confirm(
        `⚠️ क्या आप सच में ${subName} के सभी ${existingMocksInSelectedSubject.length} पुराने मॉक टेस्ट तुरंत डिलीट करना चाहते हैं?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await deleteMockTestsBySubject(selectedSubjectId);
      setDeleteSuccess(`इस विषय के ${res.deletedCount} पुराने मॉक टेस्ट डिलीट कर दिए गए!`);
      setTimeout(() => setDeleteSuccess(null), 4000);
      setDeleteOldInSubjectBeforeAdd(false);
    } catch (err: any) {
      alert('पुराने मॉक टेस्ट हटाने में त्रुटि: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleQuestionSelection = (qid: string) => {
    if (selectedQuestionIds.includes(qid)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qid));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qid]);
    }
  };

  const handleSelectAllFilteredMCQs = (qIdsToToggle: string[]) => {
    const allSelected = qIdsToToggle.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !qIdsToToggle.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedQuestionIds, ...qIdsToToggle]));
      setSelectedQuestionIds(merged);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Mock test title is required');
    if (selectedQuestionIds.length === 0) {
      return alert('Please select at least 1 question for the mock test');
    }

    setIsSubmitting(true);
    try {
      // Purge old mock tests of this subject if requested
      if (!editingMock && deleteOldInSubjectBeforeAdd && selectedSubjectId) {
        await deleteMockTestsBySubject(selectedSubjectId);
      }

      // Find full question objects for embedded questions
      const fullQuestions = mcqs.filter((m) => selectedQuestionIds.includes(m.id));

      if (editingMock) {
        await updateMockTest(editingMock.id, {
          title,
          hindiTitle: hindiTitle.trim() || undefined,
          description,
          subjectId: selectedSubjectId,
          durationMinutes: Number(duration) || 30,
          duration: Number(duration) || 30,
          totalMarks: Number(totalMarks) || selectedQuestionIds.length,
          passingMarks: Number(passingMarks) || Math.ceil(Number(totalMarks) * 0.4),
          negativeMarking: Number(negativeMarking) || 0,
          questionIds: selectedQuestionIds,
          questions: fullQuestions,
          published,
        });
      } else {
        await addMockTest({
          title,
          hindiTitle: hindiTitle.trim() || undefined,
          description,
          subjectId: selectedSubjectId,
          durationMinutes: Number(duration) || 30,
          duration: Number(duration) || 30,
          totalMarks: Number(totalMarks) || selectedQuestionIds.length,
          passingMarks: Number(passingMarks) || Math.ceil(Number(totalMarks) * 0.4),
          negativeMarking: Number(negativeMarking) || 0,
          questionIds: selectedQuestionIds,
          questions: fullQuestions,
          published,
          isFree: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      handleClose();
    } catch (err: any) {
      alert('Error saving mock test: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteMockTest(deleteTarget.id);
      setDeleteSuccess(`Mock test "${deleteTarget.name}" deleted successfully.`);
      setTimeout(() => setDeleteSuccess(null), 4000);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Failed to delete mock test: ' + err.message);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleExecuteDeleteAll = async () => {
    setIsDeletingAll(true);
    setShowDeleteAllModal(false);
    setDeleteSuccess(null);
    try {
      const res = await deleteAllMockTests();
      setDeleteSuccess(`Successfully deleted all ${res.deletedCount} mock tests!`);
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: any) {
      alert('Failed to delete mock tests: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTogglePublish = async (mock: MockTest) => {
    try {
      const isCurrentlyLive = mock.published !== false;
      await updateMockTest(mock.id, { published: !isCurrentlyLive });
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Filtered available MCQs in manual modal
  const modalCandidateMCQs = mcqs.filter((m) => {
    if (modalSubjectFilter && m.subjectId !== modalSubjectFilter) return false;
    if (modalMCQSearch && !m.question.toLowerCase().includes(modalMCQSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredMockTests = mockTests.filter((m) => {
    if (
      searchQuery &&
      !m.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(m.hindiTitle || '').includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-500" />
            Mock Tests & Exam Simulation (मॉक टेस्ट प्रबंधन)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create timed mock tests manually, via bulk CSV import, or with our intelligent zero-duplicate random generator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mockTests.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95 disabled:opacity-50"
              title="Delete all mock tests"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{isDeletingAll ? 'Deleting...' : `Delete All (${mockTests.length})`}</span>
            </button>
          )}

          {/* Multi-Test Bulk CSV */}
          <button
            onClick={() => setIsMultiBulkOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
            title="Bulk create multiple mock tests series via CSV"
          >
            <Layers className="w-4 h-4 text-violet-600" />
            <span>Multi-Test Bulk</span>
          </button>

          {/* Bulk Import Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
            title="Bulk import mock questions via CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Bulk Import (CSV)</span>
          </button>

          {/* Mock Test Theme Settings Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Mock Test & NTA Exam Portal Theme (A2Z Control)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎨 Mock Theme</span>
          </button>

          {/* Random Mock Generator Button */}
          <button
            onClick={() => setIsRandomModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-200"
            title="Auto-generate mock test from existing MCQs without duplicates"
          >
            <Shuffle className="w-4 h-4" />
            <span>⚡ Random Generator</span>
          </button>

          {/* Manual Add Button */}
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test</span>
          </button>
        </div>
      </div>

      {/* Delete notification toast */}
      {deleteSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Search Bar */}
      {mockTests.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mock tests by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-indigo-500"
          />
        </div>
      )}

      {/* Mock Tests Cards Grid */}
      {filteredMockTests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <Timer className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No mock tests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create full-length exam papers manually, upload in bulk, or use the 1-click Random Generator.
          </p>
          <div className="flex justify-center gap-2.5">
            <button
              onClick={() => setIsRandomModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-md shadow-amber-200"
            >
              ⚡ Use Random Generator
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
            >
              Create Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMockTests.map((mock) => {
            const qCount = mock.questionIds?.length || mock.questions?.length || 0;
            const attemptsCount = mockAttempts.filter((a) => a.mockTestId === mock.id).length;
            const sub = subjects.find((s) => s.id === mock.subjectId);

            return (
              <div
                key={mock.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{mock.durationMinutes || mock.duration || 30} Mins</span>
                      </span>
                      {sub && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold truncate max-w-[110px]">
                          {sub.icon || '📚'} {sub.name}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleTogglePublish(mock)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1.5 transition ${
                        mock.published !== false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                          : 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                      }`}
                      title={mock.published !== false ? 'Currently Live on User App. Click to make Unlive.' : 'Currently Unlive (hidden from User App). Click to make Live.'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${mock.published !== false ? 'bg-white animate-pulse' : 'bg-rose-300'}`} />
                      {mock.published !== false ? <Eye className="w-3 h-3 text-emerald-100" /> : <EyeOff className="w-3 h-3" />}
                      <span>{mock.published !== false ? 'LIVE' : 'UNLIVE'}</span>
                    </button>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{mock.title}</h3>
                  {mock.hindiTitle && (
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">{mock.hindiTitle}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {mock.description || 'Full syllabus practice test.'}
                  </p>
                </div>

                {/* Test Metrics */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Questions</span>
                      <strong className="text-xs text-slate-800 font-extrabold">{qCount} MCQs</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Total Marks</span>
                      <strong className="text-xs text-slate-800 font-extrabold">{mock.totalMarks || qCount}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Students</span>
                      <strong className="text-xs text-indigo-600 font-extrabold">{attemptsCount} attempts</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Negative: -{mock.negativeMarking ?? 0.33}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(mock)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                        title="Edit Mock Test"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: mock.id, name: mock.title })}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition"
                        title="Delete Mock Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10 sticky top-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-500" />
                <span>{editingMock ? 'Edit Mock Test (मॉक टेस्ट संपादित करें)' : 'Create New Mock Test (नया टेस्ट बनाएं)'}</span>
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* Subject Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Subject (विषय) *</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs bg-white font-semibold cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon || '📚'} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purge / Delete Existing Mock Tests in this Subject */}
                <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <label className="flex items-start sm:items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteOldInSubjectBeforeAdd}
                      onChange={(e) => setDeleteOldInSubjectBeforeAdd(e.target.checked)}
                      className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-extrabold text-rose-900 block text-xs">
                        पुराने टेस्ट डिलीट करके नया मॉक टेस्ट बनाएं (Replace / Delete Old)
                      </span>
                      <span className="text-[11px] text-rose-700 block">
                        {existingMocksInSelectedSubject.length > 0
                          ? `इस विषय के ${existingMocksInSelectedSubject.length} पुराने मॉक टेस्ट सेव होने पर हटा दिए जाएंगे।`
                          : 'इस विषय में अभी कोई पुराना मॉक टेस्ट नहीं है।'}
                      </span>
                    </div>
                  </label>

                  {existingMocksInSelectedSubject.length > 0 && (
                    <button
                      type="button"
                      onClick={handleQuickPurgeSubjectMocks}
                      disabled={isSubmitting}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                      title="इस विषय के सभी पुराने मॉक टेस्ट तुरंत डिलीट करें"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge ({existingMocksInSelectedSubject.length})</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Test Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPSC Prelims Full Mock 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hindi Title (हिंदी शीर्षक)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. यूपीएससी प्रीलिम्स फुल मॉक 2026"
                      value={hindiTitle}
                      onChange={(e) => setHindiTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Exam overview and instructions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min="5"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Passing Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Negative Mark</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                {/* MCQ Selection Matrix */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      Select Questions ({selectedQuestionIds.length} Selected)
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectAllFilteredMCQs(modalCandidateMCQs.map((m) => m.id))
                      }
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Select/Deselect All in List
                    </button>
                  </div>

                  {/* Filter / Search MCQs in modal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={modalSubjectFilter}
                      onChange={(e) => setModalSubjectFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold cursor-pointer"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon || '📚'} {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={modalMCQSearch}
                      onChange={(e) => setModalMCQSearch(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  {/* Question Checkboxes List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
                    {modalCandidateMCQs.length === 0 ? (
                      <p className="text-slate-400 text-center py-4 text-xs font-semibold">No questions found.</p>
                    ) : (
                      modalCandidateMCQs.map((q) => {
                        const isSelected = selectedQuestionIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleQuestionSelection(q.id)}
                            className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer text-xs transition ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-300'
                                : 'bg-white border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 text-indigo-600 rounded cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 line-clamp-2">{q.question}</p>
                              <span className="text-[10px] text-slate-400 capitalize font-medium">{q.difficulty || 'medium'}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Publish Toggle */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Publish Immediately</span>
                    <p className="text-[11px] text-slate-500">Live for student exam simulation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white sticky bottom-0">
                <div>
                  {editingMock ? (
                    <button
                      type="button"
                      onClick={() => {
                        const m = editingMock;
                        handleClose();
                        setDeleteTarget({ id: m.id, name: m.title });
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                      title="Delete this mock test"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Delete Mock Test (हटाएं)</span>
                      <span className="sm:hidden">Delete</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Fill required fields</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold border border-slate-200 bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <span>{editingMock ? 'Update Test' : 'Create Mock Test (मॉक बनाएं)'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Random Generator Modal */}
      {isRandomModalOpen && (
        <RandomMockGeneratorModal
          isOpen={isRandomModalOpen}
          onClose={() => setIsRandomModalOpen(false)}
          subjects={subjects}
          topics={topics}
          mcqs={mcqs}
          onSuccess={() => setIsRandomModalOpen(false)}
        />
      )}

      {/* Bulk Import Questions into Single Mock Test Modal */}
      {isBulkModalOpen && (
        <BulkImportMockTestModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          subjects={subjects}
          topics={topics}
          mcqs={mcqs}
          onSuccess={() => setIsBulkModalOpen(false)}
        />
      )}

      {/* Multi Mock Tests Series Bulk Import Modal */}
      {isMultiBulkOpen && (
        <BulkImportMockTestsModal
          isOpen={isMultiBulkOpen}
          onClose={() => setIsMultiBulkOpen(false)}
          subjects={subjects}
          topics={topics}
          mcqs={mcqs}
          onSuccess={() => setIsMultiBulkOpen(false)}
        />
      )}

      {/* Quiz Theme Settings Modal */}
      {isThemeModalOpen && appSettings && (
        <QuizThemeSettingsModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          appSettings={appSettings}
          initialTab="mocktest"
          onRefreshSettings={onRefreshSettings}
        />
      )}

      {/* Delete Single Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          title="Delete Mock Test"
          itemName={deleteTarget.name}
          description={`Are you sure you want to delete mock test "${deleteTarget.name}"?`}
          isLoading={isDeletingSingle}
          onConfirm={handleConfirmSingleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <DeleteConfirmModal
          isOpen={showDeleteAllModal}
          title="Delete All Mock Tests"
          isBulk={true}
          count={mockTests.length}
          description="DANGER: This will delete ALL mock tests from the database. MCQs themselves will NOT be deleted."
          confirmText="Yes, Delete All Mock Tests"
          isLoading={isDeletingAll}
          onConfirm={handleExecuteDeleteAll}
          onClose={() => setShowDeleteAllModal(false)}
        />
      )}
    </div>
  );
};

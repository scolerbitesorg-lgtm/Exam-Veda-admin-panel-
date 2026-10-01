import React, { useState, useMemo, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  X,
  CheckCircle2,
  Sparkles,
  Award,
  Calendar,
  Layers,
  Search,
  FileSpreadsheet,
  Zap,
  FolderTree,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Folder,
  SlidersHorizontal,
  RefreshCw,
  Check,
  Palette,
} from 'lucide-react';
import { addMCQ, updateMCQ, deleteMCQ, deleteAllMCQs } from '../../services/dbService';
import { BulkImportMCQModal } from './BulkImportMCQModal';
import { MCQAutoImporterModal } from './MCQAutoImporterModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { QuizThemeSettingsModal } from './QuizThemeSettingsModal';
import { detectExamMetadata } from '../../utils/examTagDetector';
import type { Subject, Topic, MCQ, AppSettings } from '../../types';

interface MCQsViewProps {
  subjects: Subject[];
  topics: Topic[];
  mcqs: MCQ[];
  appSettings?: AppSettings;
  defaultSubjectId?: string;
  defaultTopicId?: string;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  onRefreshSettings?: () => void;
}

export const MCQsView: React.FC<MCQsViewProps> = ({
  subjects,
  topics,
  mcqs,
  appSettings,
  defaultSubjectId = '',
  defaultTopicId = '',
  openCreateModal = false,
  onCloseCreateModal,
  onRefreshSettings,
}) => {
  // Folder vs List mode: default to 'folders' as requested by user
  const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders');
  const [selectedFolderTopicId, setSelectedFolderTopicId] = useState<string | null>(
    defaultTopicId || null
  );

  const [filterSubjectId, setFilterSubjectId] = useState(defaultSubjectId);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchWord, setSearchWord] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(openCreateModal);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAutoImporterOpen, setIsAutoImporterOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || subjects[0]?.id || ''
  );
  const availableTopics = topics.filter(
    (t) => !selectedSubjectId || t.subjectId === selectedSubjectId
  );
  const [selectedTopicId, setSelectedTopicId] = useState(
    defaultTopicId || availableTopics[0]?.id || ''
  );

  const [question, setQuestion] = useState('');
  const [hindiQuestion, setHindiQuestion] = useState('');
  const [options, setOptions] = useState<[string, string, string, string]>([
    '',
    '',
    '',
    '',
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [examTag, setExamTag] = useState('');
  const [examDate, setExamDate] = useState('');
  const [shift, setShift] = useState('');
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fast set of valid topic IDs
  const validTopicIdsSet = useMemo(() => new Set(topics.map((t) => t.id)), [topics]);

  // Pre-calculate per-topic counts in a single O(N) pass
  const topicStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; easy: number; medium: number; hard: number; live: number }>();
    for (let i = 0; i < mcqs.length; i++) {
      const m = mcqs[i];
      if (!m.topicId) continue;
      let stat = map.get(m.topicId);
      if (!stat) {
        stat = { total: 0, easy: 0, medium: 0, hard: 0, live: 0 };
        map.set(m.topicId, stat);
      }
      stat.total++;
      if (m.difficulty === 'easy') stat.easy++;
      else if (m.difficulty === 'hard') stat.hard++;
      else stat.medium++;
      if (m.published !== false) stat.live++;
    }
    return map;
  }, [mcqs]);

  // Pre-calculate per-subject counts in a single O(N) pass
  const subjectMCQCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < mcqs.length; i++) {
      const m = mcqs[i];
      if (!m.subjectId) continue;
      map.set(m.subjectId, (map.get(m.subjectId) || 0) + 1);
    }
    return map;
  }, [mcqs]);

  // Filtered topics for the folder view
  const filteredTopics = useMemo(() => {
    const lowerSearch = searchWord.toLowerCase().trim();
    return topics.filter((t) => {
      if (filterSubjectId && t.subjectId !== filterSubjectId) return false;
      if (lowerSearch) {
        const title = (t.title || (t as any).name || '').toLowerCase();
        const hindi = t.hindiTitle || (t as any).hindiName || '';
        return title.includes(lowerSearch) || hindi.includes(searchWord);
      }
      return true;
    });
  }, [topics, filterSubjectId, searchWord]);

  // Calculate unassigned questions (without valid topic)
  const unassignedMCQs = useMemo(() => {
    return mcqs.filter((m) => !m.topicId || !validTopicIdsSet.has(m.topicId));
  }, [mcqs, validTopicIdsSet]);

  // Active topic object when drilled into a folder
  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedFolderTopicId);
  }, [topics, selectedFolderTopicId]);

  const activeTopicSubject = useMemo(() => {
    return subjects.find((s) => s.id === activeTopic?.subjectId);
  }, [subjects, activeTopic]);

  // Filtered MCQs for the list or specific opened folder
  const filteredMCQs = useMemo(() => {
    const lowerSearch = searchWord.toLowerCase().trim();
    return mcqs.filter((m) => {
      if (selectedFolderTopicId === 'unassigned') {
        return !m.topicId || !validTopicIdsSet.has(m.topicId);
      }
      if (selectedFolderTopicId && m.topicId !== selectedFolderTopicId) return false;
      if (!selectedFolderTopicId && filterSubjectId && m.subjectId !== filterSubjectId) return false;
      if (filterDifficulty !== 'all' && m.difficulty !== filterDifficulty) return false;
      if (lowerSearch) {
        return (
          m.question.toLowerCase().includes(lowerSearch) ||
          (m.hindiQuestion || '').toLowerCase().includes(lowerSearch) ||
          (m.examTag || '').toLowerCase().includes(lowerSearch)
        );
      }
      return true;
    });
  }, [mcqs, selectedFolderTopicId, filterSubjectId, filterDifficulty, searchWord, validTopicIdsSet]);

  // Reset page to 1 when filters or folder selection change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFolderTopicId, filterSubjectId, filterDifficulty, searchWord, pageSize]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredMCQs.length / pageSize));
  const paginatedMCQs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMCQs.slice(start, start + pageSize);
  }, [filteredMCQs, currentPage, pageSize]);

  const openAddModal = (targetTopicId?: string) => {
    setEditingMCQ(null);
    const chosenTopicId = targetTopicId || selectedFolderTopicId || defaultTopicId || topics[0]?.id || '';
    const chosenTopic = topics.find((t) => t.id === chosenTopicId);
    const subId = chosenTopic?.subjectId || filterSubjectId || subjects[0]?.id || '';

    setSelectedSubjectId(subId);
    setSelectedTopicId(chosenTopicId);
    setQuestion('');
    setHindiQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setExplanation('');
    setDifficulty('medium');
    setExamTag('');
    setExamDate('');
    setShift('');
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (m: MCQ) => {
    setEditingMCQ(m);
    setSelectedSubjectId(m.subjectId);
    setSelectedTopicId(m.topicId);
    setQuestion(m.question);
    setHindiQuestion(m.hindiQuestion || '');
    setOptions([
      m.options[0] || '',
      m.options[1] || '',
      m.options[2] || '',
      m.options[3] || '',
    ]);
    setCorrectAnswer(m.correctAnswer ?? 0);
    setExplanation(m.explanation || '');
    setDifficulty(m.difficulty || 'medium');
    setExamTag(m.examTag || '');
    setExamDate(m.examDate || '');
    setShift(m.shift || '');
    setPublished(m.published ?? true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingMCQ(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options] as [string, string, string, string];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return alert('Question text is required');
    if (!selectedTopicId) return alert('Parent topic is required');
    if (options.some((o) => !o.trim())) return alert('All 4 options (A, B, C, D) are mandatory');
    if (!explanation.trim()) return alert('Please provide an explanation for student learning');

    // Auto-detect exam metadata if present in question text (e.g. "[CGL mains 2018]" or "(chsl 2023)")
    const detectedMeta = detectExamMetadata(question);
    const finalQuestion = detectedMeta.cleanQuestion || question.trim();
    const finalExamTag = examTag.trim() || detectedMeta.examTag || undefined;
    const finalExamDate = examDate.trim() || detectedMeta.examDate || undefined;
    const finalShift = shift.trim() || detectedMeta.shift || undefined;
    const finalExam = detectedMeta.exam || undefined;
    const finalYear = detectedMeta.year || undefined;

    setIsSubmitting(true);
    try {
      if (editingMCQ) {
        await updateMCQ(editingMCQ.id, {
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          question: finalQuestion,
          hindiQuestion,
          options,
          correctAnswer,
          explanation,
          difficulty,
          examTag: finalExamTag,
          examDate: finalExamDate,
          exam: finalExam,
          shift: finalShift,
          year: finalYear,
          published,
        });
      } else {
        await addMCQ({
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          question: finalQuestion,
          hindiQuestion,
          options,
          correctAnswer,
          explanation,
          difficulty,
          examTag: finalExamTag,
          examDate: finalExamDate,
          exam: finalExam,
          shift: finalShift,
          year: finalYear,
          published,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      handleClose();
    } catch (err: any) {
      alert('Error saving MCQ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteMCQ(deleteTarget.id);
      setDeleteSuccess(`MCQ deleted successfully.`);
      setTimeout(() => setDeleteSuccess(null), 3500);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Failed to delete MCQ: ' + err.message);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleExecuteDeleteAll = async () => {
    setIsDeletingAll(true);
    setShowDeleteAllModal(false);
    setDeleteSuccess(null);
    try {
      const res = await deleteAllMCQs();
      setDeleteSuccess(`Successfully deleted all ${res.deletedCount} MCQs.`);
      setTimeout(() => setDeleteSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to delete MCQs: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTogglePublish = async (m: MCQ) => {
    try {
      const isCurrentlyLive = m.published !== false;
      await updateMCQ(m.id, { published: !isCurrentlyLive });
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              MCQs & Practice Bank (विषयवार टॉपिक फोल्डर)
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              {mcqs.length} Total MCQs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Questions are organized into topic folders with live question counters for structured learning.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => {
                setViewMode('folders');
                setSelectedFolderTopicId(null);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'folders' && !selectedFolderTopicId
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Topic Folders</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Questions List</span>
            </button>
          </div>

          {mcqs.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95 disabled:opacity-50"
              title="Delete all MCQs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{isDeletingAll ? 'Deleting...' : `Delete All`}</span>
            </button>
          )}

          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="MCQ Theme & Colors (A2Z Control)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎨 MCQ Theme</span>
          </button>

          <button
            onClick={() => setIsAutoImporterOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm"
            title="कच्चा प्रश्न टेक्स्ट (Raw MCQ with Explanation) अपलोड करें"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ कच्चा प्रश्न अपलोड (Raw Text)</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
            title="Import MCQs via CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Bulk CSV</span>
          </button>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ मैनुअल फॉर्म</span>
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

      {/* Breadcrumb Navigation when inside Unassigned folder */}
      {selectedFolderTopicId === 'unassigned' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedFolderTopicId(null)}
              className="p-2 rounded-xl bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition shadow-2xs flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Topic Folders</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-800 font-bold">📁 General / Unassigned</span>
                <span className="text-slate-400 text-xs">/</span>
                <h2 className="text-sm font-extrabold text-slate-900">Uncategorized Questions</h2>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Questions not attached to any specific topic folder.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-3 py-1 rounded-xl bg-white border border-amber-200 text-amber-900 font-extrabold text-xs shadow-2xs">
              {filteredMCQs.length} MCQs Inside
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation when inside a specific topic folder */}
      {selectedFolderTopicId && selectedFolderTopicId !== 'unassigned' && activeTopic && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedFolderTopicId(null)}
              className="p-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition shadow-2xs flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Topic Folders</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 font-bold">
                  {activeTopicSubject?.icon || '📚'} {activeTopicSubject?.name || 'Subject'}
                </span>
                <span className="text-slate-400 text-xs">/</span>
                <h2 className="text-sm font-extrabold text-slate-900">{activeTopic.title || (activeTopic as any).name}</h2>
              </div>
              {(activeTopic.hindiTitle || (activeTopic as any).hindiName) && (
                <p className="text-[11px] text-slate-500 font-medium">{activeTopic.hindiTitle || (activeTopic as any).hindiName}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <span className="px-3 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-extrabold text-xs shadow-2xs">
              {filteredMCQs.length} MCQs Inside
            </span>
            <button
              onClick={() => setIsAutoImporterOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs shadow-xs flex items-center gap-1"
              title="कच्चा प्रश्न टेक्स्ट (Raw MCQ with Explanation) इस टॉपिक में अपलोड करें"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ कच्चा प्रश्न अपलोड</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1"
              title="CSV Import into this topic"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV</span>
            </button>
            <button
              onClick={() => openAddModal(activeTopic.id)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Subject Tabs (Shown when in Folders Overview or List mode) */}
      {!selectedFolderTopicId && (
        <div className="space-y-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterSubjectId('')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterSubjectId === ''
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Subjects ({mcqs.length} MCQs)
            </button>
            {subjects.map((s) => {
              const subMCQCount = subjectMCQCountsMap.get(s.id) || 0;
              return (
                <button
                  key={s.id}
                  onClick={() => setFilterSubjectId(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
                    filterSubjectId === s.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.icon || '📚'}</span>
                  <span>{s.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filterSubjectId === s.id
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {subMCQCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                viewMode === 'folders'
                  ? 'Search topic folders (e.g. Ancient History, Indian Polity)...'
                  : 'Search question keyword or concept...'
              }
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOPIC FOLDERS MATRIX (User Requested: "History 20 MCQ type folder bnao") */}
      {/* ========================================================================= */}
      {viewMode === 'folders' && !selectedFolderTopicId && (
        <div>
          {filteredTopics.length === 0 && unassignedMCQs.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
              <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No topics found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Create subjects and topics first to organize your practice question banks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTopics.map((top) => {
                const sub = subjects.find((s) => s.id === top.subjectId);
                const stat = topicStatsMap.get(top.id) || { total: 0, easy: 0, medium: 0, hard: 0, live: 0 };
                const count = stat.total;
                const easyCount = stat.easy;
                const medCount = stat.medium;
                const hardCount = stat.hard;
                const liveCount = stat.live;

                return (
                  <div
                    key={top.id}
                    onClick={() => {
                      setSelectedFolderTopicId(top.id);
                    }}
                    className="group rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-indigo-400 transition cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    {/* Top Accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: sub?.color || '#6366f1' }}
                    />

                    <div>
                      {/* Subject Name Tag & Folder Icon */}
                      <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold truncate max-w-[140px] flex items-center gap-1">
                          <span>{sub?.icon || '📚'}</span>
                          <span className="truncate">{sub?.name || 'Subject'}</span>
                        </span>

                        {/* MCQ Count Folder Badge (e.g., "History 20 MCQs") */}
                        <div
                          className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs ${
                            count > 0
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5 fill-current opacity-80" />
                          <span>{count} MCQs</span>
                        </div>
                      </div>

                      {/* Topic Title */}
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition leading-snug line-clamp-2">
                        {top.title || (top as any).name}
                      </h3>
                      {(top.hindiTitle || (top as any).hindiName) && (
                        <p className="text-xs text-indigo-700 font-semibold mt-0.5 line-clamp-1">
                          {top.hindiTitle || (top as any).hindiName}
                        </p>
                      )}
                    </div>

                    {/* Difficulty Distribution & Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      {count > 0 ? (
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          {easyCount > 0 && <span className="text-emerald-600 font-bold">{easyCount} Easy</span>}
                          {medCount > 0 && <span className="text-amber-600 font-bold">{medCount} Med</span>}
                          {hardCount > 0 && <span className="text-rose-600 font-bold">{hardCount} Hard</span>}
                          <span className="text-slate-300">•</span>
                          <span className="text-indigo-600 font-bold">{liveCount} Live</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No MCQs added yet</span>
                      )}

                      <div className="flex items-center gap-1 font-extrabold text-indigo-600 group-hover:translate-x-1 transition bg-indigo-50 px-2 py-0.5 rounded-lg">
                        <span>खोलें ({count})</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Unassigned Questions Folder if any exist */}
              {unassignedMCQs.length > 0 && (
                <div
                  onClick={() => setSelectedFolderTopicId('unassigned')}
                  className="group rounded-2xl bg-amber-50/50 border border-amber-200 p-4 shadow-2xs hover:shadow-md hover:border-amber-400 transition cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <span>📁 General</span>
                        <span>Unassigned</span>
                      </span>
                      <div className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                        <Folder className="w-3.5 h-3.5 fill-current opacity-80" />
                        <span>{unassignedMCQs.length} MCQs</span>
                      </div>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition leading-snug">
                      Uncategorized Questions
                    </h3>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">बिना टॉपिक वाले प्रश्न</p>
                  </div>
                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[10px]">
                    <span className="text-amber-800 font-medium">Link to topics</span>
                    <div className="flex items-center gap-1 font-extrabold text-amber-700 group-hover:translate-x-1 transition bg-amber-100 px-2 py-0.5 rounded-lg">
                      <span>खोलें ({unassignedMCQs.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MCQs LIST (When Inside a Topic Folder OR in All Questions List Mode)    */}
      {/* ========================================================================= */}
      {(viewMode === 'list' || selectedFolderTopicId) && (
        <div className="space-y-4">
          {/* Difficulty Filter bar & Page size */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1">Difficulty:</span>
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    filterDifficulty === diff
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:border-indigo-500"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>

              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {filteredMCQs.length === 0
                  ? '0 MCQs'
                  : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(
                      currentPage * pageSize,
                      filteredMCQs.length
                    )} of ${filteredMCQs.length}`}
              </span>
            </div>
          </div>

          {filteredMCQs.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No MCQs found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Add your practice question or bulk import via CSV/Raw text.
              </p>
              <button
                onClick={() => openAddModal(selectedFolderTopicId || undefined)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
              >
                Create MCQ Question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedMCQs.map((m, localIdx) => {
                const idx = (currentPage - 1) * pageSize + localIdx;
                const sub = subjects.find((s) => s.id === m.subjectId);
                const top = topics.find((t) => t.id === m.topicId);

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition space-y-3"
                  >
                    {/* Top Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold flex items-center justify-center">
                          #{idx + 1}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {sub?.icon || '📚'} {sub?.name || 'Subject'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {top?.title || (top as any)?.name || 'Topic'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            m.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.difficulty === 'hard'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {m.difficulty || 'medium'}
                        </span>

                        {(m.examTag || m.examDate || m.exam) && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            {m.examTag || `${m.exam || ''} ${m.examDate || ''}`.trim()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePublish(m)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1.5 transition ${
                            m.published !== false
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              : 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                          }`}
                          title={m.published !== false ? 'Currently Live on User App. Click to make Unlive.' : 'Currently Unlive (hidden from User App). Click to make Live.'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${m.published !== false ? 'bg-white animate-pulse' : 'bg-rose-300'}`} />
                          {m.published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{m.published !== false ? 'LIVE' : 'UNLIVE'}</span>
                        </button>

                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                          title="Edit Question"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: m.id, name: m.question })}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                        {m.question}
                      </h4>
                      {m.hindiQuestion && (
                        <p className="text-xs text-indigo-700 font-semibold mt-1">
                          {m.hindiQuestion}
                        </p>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {m.options.map((opt, oIdx) => {
                        const isCorrect = m.correctAnswer === oIdx;
                        const label = String.fromCharCode(65 + oIdx);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-600'
                              }`}
                            >
                              {label}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {m.explanation && (
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-950">
                        <strong className="text-amber-900 font-bold mr-1">Explanation:</strong>
                        <span>{m.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">
                    Page <span className="font-extrabold text-slate-900">{currentPage}</span> of{' '}
                    <span className="font-extrabold text-slate-900">{totalPages}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition shadow-2xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          return Math.abs(p - currentPage) <= 1;
                        })
                        .map((p, pIdx, arr) => {
                          const prev = arr[pIdx - 1];
                          const showEllipsis = prev && p - prev > 1;

                          return (
                            <React.Fragment key={p}>
                              {showEllipsis && (
                                <span className="px-1 text-slate-400 font-bold text-xs">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(p)}
                                className={`w-8 h-8 rounded-xl text-xs font-black transition flex items-center justify-center ${
                                  currentPage === p
                                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition shadow-2xs"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit MCQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-20">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                {editingMCQ ? 'Edit Question (प्रश्न संपादित करें)' : 'Create MCQ (नया प्रश्न जोड़ें)'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Subject & Topic Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject (विषय) *</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      const subId = e.target.value;
                      setSelectedSubjectId(subId);
                      const avail = topics.filter((t) => t.subjectId === subId);
                      setSelectedTopicId(avail[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon || '📚'} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topic Folder (टॉपिक) *</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                  >
                    {availableTopics.length === 0 ? (
                      <option value="">No topics in this subject</option>
                    ) : (
                      availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title || (t as any).name} {(t.hindiTitle || (t as any).hindiName) ? `(${(t.hindiTitle || (t as any).hindiName)})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Question English & Hindi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Statement (English) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Which Constitutional Amendment lowered voting age from 21 to 18 years?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Question in Hindi (हिंदी प्रश्न)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. किस संविधान संशोधन द्वारा मतदान की आयु 21 से घटाकर 18 वर्ष की गई?"
                  value={hindiQuestion}
                  onChange={(e) => setHindiQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Options & Correct Answer Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Four Options & Mark Correct Answer
                  </span>
                  <span className="text-[10px] text-slate-500">Radio select the right answer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {options.map((opt, idx) => {
                    const label = String.fromCharCode(65 + idx);
                    const isSelected = correctAnswer === idx;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex items-center gap-2 bg-white transition ${
                          isSelected ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={isSelected}
                          onChange={() => setCorrectAnswer(idx)}
                          className="w-4 h-4 text-emerald-600 cursor-pointer"
                        />
                        <span className="font-bold text-slate-600 w-4">{label}:</span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${label}`}
                          className="flex-1 px-2 py-1 rounded-lg border-0 focus:ring-0 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exam Reference & Date (Optional) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    Exam Reference & Date (परीक्षा विवरण - Optional)
                  </span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md font-semibold">
                    वैकल्पिक (Optional)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Exam Name & Shift (जैसे SSC CGL Mains 2018 / CHSL 2023)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SSC CGL Mains 2018 / UPSC Prelims 2021"
                      value={examTag}
                      onChange={(e) => setExamTag(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Exam Date / Year (दिनांक या वर्ष)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15-10-2018 / 2023"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  💡 टिप: आप प्रश्न टेक्स्ट में भी [CGL mains 2018] या (ex- chsl 2023) लिख सकते हैं, सिस्टम इसे अपने आप पहचान लेगा।
                </p>
              </div>

              {/* Explanation & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Detailed Explanation (व्याख्या) *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide concept breakdown and context for students..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                  >
                    <option value="easy">Easy (सरल)</option>
                    <option value="medium">Medium (मध्यम)</option>
                    <option value="hard">Hard (कठिन)</option>
                  </select>
                </div>
              </div>

              {/* Live Status Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Publish to Student App</span>
                  <p className="text-[11px] text-slate-500">Available instantly in Practice Quiz and Tests</p>
                </div>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editingMCQ ? 'Update Question' : 'Save Question'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <BulkImportMCQModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          subjects={subjects}
          topics={topics}
          defaultSubjectId={selectedFolderTopicId ? activeTopicSubject?.id : filterSubjectId}
          defaultTopicId={selectedFolderTopicId || undefined}
        />
      )}

      {/* Auto Importer AI Modal */}
      {isAutoImporterOpen && (
        <MCQAutoImporterModal
          isOpen={isAutoImporterOpen}
          onClose={() => setIsAutoImporterOpen(false)}
          subjects={subjects}
          topics={topics}
          existingMCQs={mcqs}
          defaultSubjectId={selectedFolderTopicId ? activeTopicSubject?.id : filterSubjectId}
          defaultTopicId={selectedFolderTopicId || undefined}
        />
      )}

      {/* Quiz Theme Settings Modal */}
      {isThemeModalOpen && appSettings && (
        <QuizThemeSettingsModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          appSettings={appSettings}
          initialTab="mcq"
          onRefreshSettings={onRefreshSettings}
        />
      )}

      {/* Delete Single Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          title="Delete MCQ Question"
          itemName={deleteTarget.name}
          description="Are you sure you want to delete this question? This cannot be undone."
          isLoading={isDeletingSingle}
          onConfirm={handleConfirmSingleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <DeleteConfirmModal
          isOpen={showDeleteAllModal}
          title="Delete All MCQs"
          isBulk={true}
          count={mcqs.length}
          description="DANGER: This will delete ALL MCQ questions from the database."
          confirmText="Yes, Delete All MCQs"
          isLoading={isDeletingAll}
          onConfirm={handleExecuteDeleteAll}
          onClose={() => setShowDeleteAllModal(false)}
        />
      )}
    </div>
  );
};

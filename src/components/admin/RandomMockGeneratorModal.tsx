import React, { useState } from 'react';
import {
  Sparkles,
  Shuffle,
  X,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FolderTree,
  Clock,
  Layers,
  Award,
  Filter,
  Check,
  Zap,
  Trash2,
} from 'lucide-react';
import { addMockTest, deleteMockTestsBySubject } from '../../services/dbService';
import type { Subject, Topic, MCQ } from '../../types';

interface RandomMockGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  mcqs: MCQ[];
  onSuccess?: () => void;
}

export const RandomMockGeneratorModal: React.FC<RandomMockGeneratorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  mcqs,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [totalMarks, setTotalMarks] = useState<number>(20);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.33);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [purgeOldBeforeGenerate, setPurgeOldBeforeGenerate] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    success: boolean;
    title: string;
    count: number;
    subjectsUsed: number;
  } | null>(null);

  if (!isOpen) return null;

  // Toggle subject selection
  const handleToggleSubject = (subId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  // Select all or clear subjects
  const handleSelectAllSubjects = () => {
    if (selectedSubjectIds.length === subjects.length) {
      setSelectedSubjectIds([]);
      setSelectedTopicIds([]);
    } else {
      setSelectedSubjectIds(subjects.map((s) => s.id));
    }
  };

  // Filter available candidate MCQs based on selected subjects & difficulty
  const candidateMCQs = mcqs.filter((m) => {
    if (!m.published && m.published !== undefined) return false;
    if (selectedSubjectIds.length > 0 && !selectedSubjectIds.includes(m.subjectId)) {
      return false;
    }
    if (selectedTopicIds.length > 0 && !selectedTopicIds.includes(m.topicId)) {
      return false;
    }
    if (difficultyFilter !== 'all' && m.difficulty !== difficultyFilter) {
      return false;
    }
    return true;
  });

  // Calculate unique questions in candidate pool (Deduplication check)
  const uniqueCandidateMap = new Map<string, MCQ>();
  candidateMCQs.forEach((q) => {
    // Deduplicate by normalized question text and id
    const key = (q.question || '').trim().toLowerCase();
    if (key && !uniqueCandidateMap.has(key)) {
      uniqueCandidateMap.set(key, q);
    }
  });
  const uniqueCandidateCount = uniqueCandidateMap.size;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Mock Test Title is required');

    if (uniqueCandidateCount === 0) {
      return alert('No MCQs found matching your selected subjects/filters. Please adjust your selection.');
    }

    const targetCount = Math.min(questionCount, uniqueCandidateCount);
    if (targetCount <= 0) return;

    setIsGenerating(true);
    try {
      // Purge old mock tests if option selected
      if (purgeOldBeforeGenerate) {
        if (selectedSubjectIds.length > 0) {
          for (const sId of selectedSubjectIds) {
            await deleteMockTestsBySubject(sId);
          }
        }
      }

      // 1. Get unique candidate array
      const uniqueList = Array.from(uniqueCandidateMap.values());

      // 2. Fisher-Yates unbiased random shuffle
      for (let i = uniqueList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueList[i], uniqueList[j]] = [uniqueList[j], uniqueList[i]];
      }

      // 3. Slice exact required count (100% Guaranteed NO DUPLICATES)
      const selectedQuestions = uniqueList.slice(0, targetCount);
      const selectedQuestionIds = selectedQuestions.map((q) => q.id);

      // Determine primary subject ID or 'all'
      const primarySubjectId = selectedSubjectIds.length === 1 ? selectedSubjectIds[0] : '';

      // 4. Save directly to Firestore via addMockTest
      await addMockTest({
        title,
        hindiTitle: hindiTitle.trim() || undefined,
        description: description.trim() || `Auto-generated test with ${selectedQuestions.length} unique randomized MCQs across syllabus.`,
        subjectId: primarySubjectId,
        duration: Number(durationMinutes) || 30,
        durationMinutes: Number(durationMinutes) || 30,
        totalMarks: Number(totalMarks) || targetCount,
        passingMarks: Math.ceil((Number(totalMarks) || targetCount) * 0.4),
        negativeMarking: Number(negativeMarking) || 0,
        questionIds: selectedQuestionIds,
        questions: selectedQuestions,
        published: true,
        isFree: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setGeneratedResult({
        success: true,
        title,
        count: selectedQuestions.length,
        subjectsUsed: selectedSubjectIds.length || subjects.length,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('Error generating mock test: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                Random Mock Test Generator
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Zero Duplicates
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Generate high-yield mock exam from your existing MCQs pool automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generatedResult ? (
          <div className="p-6 sm:p-8 text-center space-y-4 my-auto overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Mock Test Created Successfully!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Test <strong className="text-indigo-600">"{generatedResult.title}"</strong> has been created with{' '}
              <strong>{generatedResult.count} unique, randomized questions</strong> and is now live for students.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setGeneratedResult(null);
                  setTitle('');
                  setHindiTitle('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Generate Another Test
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 cursor-pointer"
              >
                Done & View Mock Tests
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Purge / Replace Existing Mock Tests Option */}
              <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/90 flex items-center justify-between gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={purgeOldBeforeGenerate}
                    onChange={(e) => setPurgeOldBeforeGenerate(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-extrabold text-rose-900 block text-xs">
                      टेस्ट बनाने से पहले चुने गए विषयों के पुराने मॉक टेस्ट हटाएं (Purge Old Mock Tests)
                    </span>
                    <span className="text-[11px] text-rose-700">
                      चेक करने पर चुने गए विषयों के पुराने मॉक टेस्ट हटाकर यह नया टेस्ट सेव होगा।
                    </span>
                  </div>
                </label>
              </div>

              {/* Title & Hindi Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mock Test Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPSC Prelims Full Mock Test #1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-xs font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hindi Title (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. यूपीएससी प्रीलिम्स मॉक टेस्ट #1"
                    value={hindiTitle}
                    onChange={(e) => setHindiTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Subject Filter Chips */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Select Source Subjects (विषय चुनें)
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllSubjects}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {selectedSubjectIds.length === subjects.length ? 'Deselect All' : 'Select All Subjects'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    const subMCQCount = mcqs.filter((m) => m.subjectId === sub.id).length;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleToggleSubject(sub.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{sub.icon || '📚'}</span>
                        <span>{sub.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {subMCQCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500">
                  {selectedSubjectIds.length === 0
                    ? 'All subjects included in random question pool.'
                    : `${selectedSubjectIds.length} subject(s) selected.`}
                </p>
              </div>

              {/* Configuration Parameters: Question Count, Time, Marks, Negative */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-white border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Questions Count
                  </label>
                  <input
                    type="number"
                    min="5"
                    max={Math.max(5, uniqueCandidateCount)}
                    value={questionCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuestionCount(val);
                      setTotalMarks(val); // default 1 mark per question
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Pool: {uniqueCandidateCount} unique
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Timer in app</span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Max score</span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    Negative Mark
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">per wrong answer</span>
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Difficulty Mix:</span>
                <div className="flex gap-1">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-2.5 py-1 rounded-lg capitalize text-xs font-bold transition cursor-pointer ${
                        difficultyFilter === diff
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {diff === 'all' ? 'All Mixed' : diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deduplication Guarantee Card */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-extrabold text-emerald-950">
                    Strict Deduplication Guarantee Enabled
                  </strong>
                  <span>
                    The generator filters duplicate question IDs and identical question texts before random selection. Every student attempt receives genuine unique questions.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold border border-slate-200 bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || uniqueCandidateCount === 0}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold flex items-center gap-2 shadow-md shadow-amber-200 disabled:opacity-50 transition cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Shuffle className="w-4 h-4 animate-spin" />
                    <span>Generating Non-Duplicate Test...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate Mock Test ({Math.min(questionCount, uniqueCandidateCount)} Questions)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

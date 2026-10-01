import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  BookOpen,
  FolderTree,
  Eye,
  RefreshCw,
  HelpCircle,
  Cloud,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Zap,
  Layers,
  Calendar,
  Award,
} from 'lucide-react';
import type { Subject, Topic, MCQ } from '../../types';
import { addMCQsBatch, deleteMCQsByTopic } from '../../services/dbService';
import { detectExamMetadata } from '../../utils/examTagDetector';

interface MCQAutoImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  existingMCQs: MCQ[];
  defaultSubjectId?: string;
  defaultTopicId?: string;
  onSuccess?: () => void;
}

export interface ParsedItem {
  id: string;
  rawIndex: number;
  questionNumber: number;
  question: string;
  options: [string, string, string, string];
  correctOption: number; // 0 = A, 1 = B, 2 = C, 3 = D
  correctLetter: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examTag?: string;
  examDate?: string;
  exam?: string;
  shift?: string;
  year?: number | string;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

const HINDI_SAMPLE_INPUT = `1. भारत का राष्ट्रीय पुष्प क्या है? [UPPSC 2022]
A. गुलाब
B. कमल
C. गेंदा
D. चमेली
Ans. B
Exp: कमल (Nelumbo nucifera) भारत का राष्ट्रीय पुष्प है।

2. भारतीय संविधान का कौन सा अनुच्छेद 'मौलिक अधिकारों' से संबंधित है? (CGL mains 2018)
A. अनुच्छेद 5 से 11
B. अनुच्छेद 12 से 35
C. अनुच्छेद 36 से 51
D. अनुच्छेद 51A
Ans. B
Exp: संविधान के भाग-3 में अनुच्छेद 12 से 35 तक मौलिक अधिकारों (Fundamental Rights) का उल्लेख है।

3. मानव शरीर की सबसे बड़ी ग्रंथि कौन सी है? [CHSL 2023, Date: 15-03-2023]
A. अग्न्याशय (Pancreas)
B. यकृत (Liver)
C. थायरॉयड (Thyroid)
D. पिट्यूटरी (Pituitary)
Ans. B
Exp: यकृत (Liver) मानव शरीर की सबसे बड़ी ग्रंथि है जो पित्त (Bile) का निर्माण करती है।

4. ध्वनि तरंगें किस माध्यम में गमन नहीं कर सकती हैं?
A. ठोस (Solid)
B. द्रव (Liquid)
C. गैस (Gas)
D. निर्वात (Vacuum)
Ans. D
Exp: ध्वनि तरंगें यांत्रिक तरंगें हैं जिन्हें संचरण के लिए भौतिक माध्यम की आवश्यकता होती है, निर्वात में नहीं चल सकतीं।`;

export const MCQAutoImporterModal: React.FC<MCQAutoImporterModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  existingMCQs,
  defaultSubjectId = '',
  defaultTopicId = '',
  onSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [debouncedInputText, setDebouncedInputText] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || subjects[0]?.id || ''
  );
  const availableTopics = topics.filter(
    (t) => !selectedSubjectId || t.subjectId === selectedSubjectId
  );
  const [selectedTopicId, setSelectedTopicId] = useState(
    defaultTopicId || availableTopics[0]?.id || ''
  );
  const [defaultDifficulty, setDefaultDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [batchExamDate, setBatchExamDate] = useState('');
  const [batchExamTag, setBatchExamTag] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [purgeOldBeforeImport, setPurgeOldBeforeImport] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveResult, setSaveResult] = useState<{ total: number; success: boolean } | null>(null);

  // Sync subject & topic when props change
  useEffect(() => {
    if (defaultSubjectId) setSelectedSubjectId(defaultSubjectId);
    if (defaultTopicId) setSelectedTopicId(defaultTopicId);
  }, [defaultSubjectId, defaultTopicId]);

  // Debounce input text changes so typing/pasting is lag-free
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputText(inputText);
    }, 120);
    return () => clearTimeout(handler);
  }, [inputText]);

  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    const filtered = topics.filter((t) => t.subjectId === newSubjectId);
    setSelectedTopicId(filtered[0]?.id || '');
  };

  // Pre-normalized Set for instant O(1) duplicate checks
  const existingNormalizedSet = useMemo(() => {
    const set = new Set<string>();
    for (const em of existingMCQs) {
      if (em.question) {
        const norm = em.question.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '');
        if (norm.length > 5) set.add(norm);
      }
    }
    return set;
  }, [existingMCQs]);

  // Robust Auto Parser
  const parsedItems = useMemo<ParsedItem[]>(() => {
    if (!debouncedInputText.trim()) return [];

    const lines = debouncedInputText.split(/\r?\n/);
    const rawBlocks: string[][] = [];
    let currentBlock: string[] = [];

    // Regex to detect start of a new question
    const qStartRegex = /^\s*(?:Q\.?\s*\d+|Question\s*\d+|\d+[\.:\)\-])[\s]/i;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (qStartRegex.test(trimmed) && currentBlock.length > 0) {
        rawBlocks.push(currentBlock);
        currentBlock = [trimmed];
      } else {
        currentBlock.push(trimmed);
      }
    });
    if (currentBlock.length > 0) {
      rawBlocks.push(currentBlock);
    }

    const items: ParsedItem[] = rawBlocks.map((block, idx) => {
      let qNum = idx + 1;
      let questionLines: string[] = [];
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let detectedAnsLetter: 'A' | 'B' | 'C' | 'D' | null = null;
      let explanationLines: string[] = [];

      type Mode = 'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'explanation' | 'none';
      let mode: Mode = 'question';

      block.forEach((line, lineIndex) => {
        if (lineIndex === 0) {
          const numMatch = line.match(/^\s*(?:Q\.?\s*(\d+)|Question\s*(\d+)|(\d+)[\.:\)\-])/i);
          if (numMatch) {
            const parsedNum = parseInt(numMatch[1] || numMatch[2] || numMatch[3], 10);
            if (!isNaN(parsedNum)) qNum = parsedNum;
          }
        }

        // Option Matchers
        const optAMatch = line.match(/^\s*(?:A[\.:\)\-]|(?:\(A\))|(?:\[A\])|a[\.:\)\-])\s+(.*)/i);
        const optBMatch = line.match(/^\s*(?:B[\.:\)\-]|(?:\(B\))|(?:\[B\])|b[\.:\)\-])\s+(.*)/i);
        const optCMatch = line.match(/^\s*(?:C[\.:\)\-]|(?:\(C\))|(?:\[C\])|c[\.:\)\-])\s+(.*)/i);
        const optDMatch = line.match(/^\s*(?:D[\.:\)\-]|(?:\(D\))|(?:\[D\])|d[\.:\)\-])\s+(.*)/i);

        // Answer Matcher
        const ansMatch = line.match(
          /^\s*(?:Ans\.?|Answer|Correct\s*Answer|Correct|उत्तर|उ\.?)[\s\.:\)\-]*([A-D1-4])/i
        );

        // Explanation Matcher
        const expMatch = line.match(
          /^\s*(?:Exp\.?|Explain\.?|Explanation|व्याख्या|विस्तृत\s*व्याख्या|Notes?|विवरण)[\s\.:\)\-]*(.*)/i
        );

        if (ansMatch) {
          const rawChar = ansMatch[1].toUpperCase();
          if (rawChar === '1' || rawChar === 'A') detectedAnsLetter = 'A';
          else if (rawChar === '2' || rawChar === 'B') detectedAnsLetter = 'B';
          else if (rawChar === '3' || rawChar === 'C') detectedAnsLetter = 'C';
          else if (rawChar === '4' || rawChar === 'D') detectedAnsLetter = 'D';
          mode = 'none';
          return;
        }

        if (expMatch) {
          mode = 'explanation';
          if (expMatch[1] && expMatch[1].trim()) {
            explanationLines.push(expMatch[1].trim());
          }
          return;
        }

        if (optAMatch) {
          mode = 'optA';
          optA = optAMatch[1].trim();
          return;
        }
        if (optBMatch) {
          mode = 'optB';
          optB = optBMatch[1].trim();
          return;
        }
        if (optCMatch) {
          mode = 'optC';
          optC = optCMatch[1].trim();
          return;
        }
        if (optDMatch) {
          mode = 'optD';
          optD = optDMatch[1].trim();
          return;
        }

        // Accumulate text based on current mode
        if (mode === 'question') {
          let cleaned = line;
          if (lineIndex === 0) {
            cleaned = line.replace(/^\s*(?:Q\.?\s*\d+|Question\s*\d+|\d+[\.:\)\-])\s*/i, '');
          }
          if (cleaned.trim()) questionLines.push(cleaned.trim());
        } else if (mode === 'optA') {
          optA += ' ' + line.trim();
        } else if (mode === 'optB') {
          optB += ' ' + line.trim();
        } else if (mode === 'optC') {
          optC += ' ' + line.trim();
        } else if (mode === 'optD') {
          optD += ' ' + line.trim();
        } else if (mode === 'explanation') {
          explanationLines.push(line.trim());
        }
      });

      const rawCombinedQuestion = questionLines.join(' ').trim();
      const finalExplanation = explanationLines.join(' ').trim();

      // Auto-Detect Exam Tag, Date, Shift, and Year (Supports [CGL mains 2018], (ex- chsl 2023), separate Exam/Date lines, etc.)
      const examMeta = detectExamMetadata(rawCombinedQuestion, block);
      const finalQuestion = examMeta.cleanQuestion;

      let correctOption = 0;
      let finalLetter: 'A' | 'B' | 'C' | 'D' = 'A';
      if (detectedAnsLetter === 'B') {
        correctOption = 1;
        finalLetter = 'B';
      } else if (detectedAnsLetter === 'C') {
        correctOption = 2;
        finalLetter = 'C';
      } else if (detectedAnsLetter === 'D') {
        correctOption = 3;
        finalLetter = 'D';
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!finalQuestion || finalQuestion.length < 3) {
        errors.push('प्रश्न टेक्स्ट नहीं मिला');
      }
      if (!optA.trim()) errors.push('विकल्प A खाली है');
      if (!optB.trim()) errors.push('विकल्प B खाली है');
      if (!optC.trim()) errors.push('विकल्प C खाली है');
      if (!optD.trim()) errors.push('विकल्प D खाली है');
      if (!detectedAnsLetter) {
        warnings.push('उत्तर (Ans) नहीं मिला, डिफ़ॉल्ट (A) चुना गया');
      }

      const normalizedQ = finalQuestion.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '');
      const isDuplicate = normalizedQ.length > 5 && existingNormalizedSet.has(normalizedQ);

      if (isDuplicate) {
        warnings.push('यह प्रश्न पहले से बैंक में मौजूद हो सकता है (Duplicate)');
      }

      return {
        id: `parsed_${idx}`,
        rawIndex: idx + 1,
        questionNumber: qNum,
        question: finalQuestion,
        options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
        correctOption,
        correctLetter: finalLetter,
        explanation: finalExplanation,
        difficulty: defaultDifficulty,
        examTag: examMeta.examTag || batchExamTag.trim() || undefined,
        examDate: examMeta.examDate || batchExamDate.trim() || undefined,
        exam: examMeta.exam,
        shift: examMeta.shift,
        year: examMeta.year,
        errors,
        warnings,
        isDuplicate,
      };
    });

    return items;
  }, [debouncedInputText, defaultDifficulty, existingNormalizedSet, batchExamDate, batchExamTag]);

  const validCount = parsedItems.filter((i) => i.errors.length === 0).length;

  const handleFillSampleText = () => {
    setInputText(HINDI_SAMPLE_INPUT);
  };

  const handleResetData = () => {
    if (window.confirm('क्या आप टेक्स्ट साफ़ (Reset) करना चाहते हैं?')) {
      setInputText('');
    }
  };

  // Cloud Save & Share Handler
  const handleSaveToCloud = async () => {
    if (!selectedSubjectId) {
      alert('कृपया विषय (Subject) चुनें!');
      return;
    }
    if (!selectedTopicId) {
      alert('कृपया टॉपिक / अध्याय (Topic) चुनें!');
      return;
    }

    const validItems = parsedItems.filter((it) => it.errors.length === 0);
    if (validItems.length === 0) {
      alert('सहेजने के लिए कोई वैध प्रश्न नहीं मिले। कृपया दिए गए फॉर्मेट में प्रश्न भरें।');
      return;
    }

    setIsSaving(true);
    setSaveProgress(10);

    try {
      if (purgeOldBeforeImport && selectedTopicId) {
        await deleteMCQsByTopic(selectedTopicId);
      }

      const mcqsToUpload = validItems.map((item, index) => {
        return {
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          question: item.question,
          hindiQuestion: item.question,
          options: item.options,
          correctAnswer: item.correctOption,
          explanation: item.explanation,
          difficulty: item.difficulty,
          examTag: item.examTag || batchExamTag.trim() || undefined,
          examDate: item.examDate || batchExamDate.trim() || undefined,
          exam: item.exam || undefined,
          shift: item.shift || undefined,
          year: item.year || undefined,
          published: true,
          order: index + 1,
        };
      });

      setSaveProgress(50);
      await addMCQsBatch(mcqsToUpload);
      setSaveProgress(100);

      setSaveResult({
        total: mcqsToUpload.length,
        success: true,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to batch save MCQs:', err);
      alert('सहेजने में त्रुटि: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100/95 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar matching Screenshot */}
        <div className="px-4 sm:px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition active:scale-95 border border-slate-200 shadow-2xs"
          >
            <span>← होम</span>
          </button>

          <div className="flex items-center gap-2 text-center">
            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              शेयर्ड क्लाउड एडमिन पोर्टल
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Cloud Live Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-extrabold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>क्लाउड लाइव</span>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetData}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-2xs transition active:scale-95"
              title="टेक्स्ट खाली करें"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>डेटा रीसेट</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {saveResult ? (
            /* Success Screen */
            <div className="text-center py-12 px-4 space-y-4 bg-white rounded-3xl border border-emerald-200 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  🎉 क्लाउड में सफलतापूर्वक सहेजा गया!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  कुल <span className="font-extrabold text-emerald-700">{saveResult.total} प्रश्न</span> क्लाउड डेटाबेस में लाइव जोड़ दिए गए हैं।
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSaveResult(null);
                    setInputText('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                >
                  और प्रश्न जोड़ें
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-md"
                >
                  पूर्ण एवं बंद करें
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* CARD 1: STEP 1 - Subject & Topic */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    विषय एवं अध्याय चुनें (Select Target Subject & Topic) *
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-purple-600" />
                      <span>विषय (Subject) *</span>
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon || '📚'} {s.name} {s.hindiName ? `(${s.hindiName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <FolderTree className="w-3 h-3 text-purple-600" />
                      <span>अध्याय / फोल्डर (Topic) *</span>
                    </label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      {availableTopics.length === 0 && (
                        <option value="">इस विषय में कोई टॉपिक नहीं मिला</option>
                      )}
                      {availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          📁 #{t.order} {t.title || (t as any).name} {(t.hindiTitle || (t as any).hindiName) ? `(${(t.hindiTitle || (t as any).hindiName)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Purge / Replace Existing MCQs in this Topic */}
                <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/90 flex items-center justify-between gap-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={purgeOldBeforeImport}
                      onChange={(e) => setPurgeOldBeforeImport(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-extrabold text-rose-900 block text-xs">
                        सहेजने से पहले इस टॉपिक के पुराने प्रश्न डिलीट करें (Purge / Replace Old)
                      </span>
                      <span className="text-[11px] text-rose-700">
                        चेक करने पर इस टॉपिक में मौजूद सभी पुराने प्रश्न डिलीट होकर केवल ये नए प्रश्न सहेजे जाएंगे।
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* CARD 2: STEP 2 - Difficulty & Useful Notes */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    कठिनाई स्तर एवं परीक्षा उपयोगी बिंदु (Exam Points)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      डिफ़ॉल्ट कठिनाई (Difficulty Level)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setDefaultDifficulty('easy')}
                        className={`py-1.5 rounded-lg transition ${
                          defaultDifficulty === 'easy'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        सरल (Easy)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultDifficulty('medium')}
                        className={`py-1.5 rounded-lg transition ${
                          defaultDifficulty === 'medium'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        मध्यम (Med)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultDifficulty('hard')}
                        className={`py-1.5 rounded-lg transition ${
                          defaultDifficulty === 'hard'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        कठिन (Hard)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      📌 परीक्षा उपयोगी बिंदु (Notes)...
                    </label>
                    <input
                      type="text"
                      value={examNotes}
                      onChange={(e) => setExamNotes(e.target.value)}
                      placeholder="📌 परीक्षा उपयोगी बिंदु..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Batch Exam Date & Exam Tag for entire batch */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      संपूर्ण बैच हेतु परीक्षा विवरण (Batch Exam Date & Tag)
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                      Optional
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>Batch Exam Date / Year (दिनांक या वर्ष)</span>
                      </label>
                      <input
                        type="text"
                        value={batchExamDate}
                        onChange={(e) => setBatchExamDate(e.target.value)}
                        placeholder="उदा. 15-10-2018 या 2023"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>Batch Exam Tag / Shift (परीक्षा नाम व शिफ्ट)</span>
                      </label>
                      <input
                        type="text"
                        value={batchExamTag}
                        onChange={(e) => setBatchExamTag(e.target.value)}
                        placeholder="उदा. SSC CGL Mains 2018"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: STEP 3 - Raw MCQ with Explanation (EXACT MATCH of screenshot) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      कच्चा प्रश्न टेक्स्ट (Raw MCQ with Explanation) *
                    </h3>
                  </div>

                  {/* Sample Text Fill Button */}
                  <button
                    type="button"
                    onClick={handleFillSampleText}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>नमूना टेक्स्ट भरें</span>
                  </button>
                </div>

                {/* Textarea matching placeholder format */}
                <div className="relative">
                  <textarea
                    rows={12}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`1.  प्रश्न यहाँ लिखें?
A.  विकल्प 1
B.  विकल्प 2
C.  विकल्प 3
D.  विकल्प 4
Ans.  B
Exp: विस्तृत व्याख्या यहाँ...`}
                    className="w-full p-4 rounded-2xl bg-white border border-slate-300 font-medium text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100 resize-y transition shadow-inner font-mono"
                  />
                </div>

                {/* Detected Count Chip underneath Textarea */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        parsedItems.length > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {parsedItems.length}{' '}
                      प्रश्न पहचाने गए
                    </span>
                    {validCount < parsedItems.length && (
                      <span className="text-rose-600 text-[10px] ml-1 font-semibold">
                        ({parsedItems.length - validCount} में त्रुटि)
                      </span>
                    )}
                  </div>

                  {parsedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPreviewList(!showPreviewList)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
                    >
                      <span>{showPreviewList ? 'प्रश्नों की सूची छिपाएँ' : 'पहचाने गए प्रश्न देखें'}</span>
                      {showPreviewList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Expandable Preview of recognized questions */}
                {showPreviewList && parsedItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {parsedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                          item.errors.length > 0
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 flex-1 min-w-0">
                            प्रश्न {idx + 1}: {item.question || 'प्रश्न अनुपलब्ध'}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(item.examTag || item.examDate) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                <Award className="w-3 h-3 text-amber-600" />
                                {item.examTag || item.examDate}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px]">
                              उत्तर: ({item.correctLetter})
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                          <div>A: {item.options[0]}</div>
                          <div>B: {item.options[1]}</div>
                          <div>C: {item.options[2]}</div>
                          <div>D: {item.options[3]}</div>
                        </div>

                        {item.explanation && (
                          <p className="text-[10px] text-purple-800 bg-purple-50 p-1.5 rounded-lg">
                            💡 <strong>व्याख्या:</strong> {item.explanation}
                          </p>
                        )}

                        {item.errors.length > 0 && (
                          <p className="text-[10px] text-rose-600 font-bold">
                            ⚠️ {item.errors.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BIG BROAD ACTION BUTTON matching screenshot */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSaveToCloud}
                  disabled={isSaving || parsedItems.length === 0}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 active:scale-98 text-slate-800 font-black text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300/80"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                      <span>क्लाउड में सहेजा जा रहा है ({saveProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5 text-slate-700" />
                      <span>क्लाउड में सहेजें और शेयर करें</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

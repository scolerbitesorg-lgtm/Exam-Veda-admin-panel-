import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  Award,
  Calendar,
} from 'lucide-react';
import type { Subject, Topic } from '../../types';
import { addMCQsBatch, deleteMCQsByTopic } from '../../services/dbService';
import { detectExamMetadata } from '../../utils/examTagDetector';
import { Trash2 } from 'lucide-react';

interface BulkImportMCQModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  defaultSubjectId?: string;
  defaultTopicId?: string;
}

interface ParsedMCQItem {
  question: string;
  hindiQuestion?: string;
  options: [string, string, string, string];
  correctOption: number; // 0, 1, 2, 3
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examTag?: string;
  examDate?: string;
  exam?: string;
  shift?: string;
  year?: number | string;
  isValid: boolean;
  errorMessage?: string;
}

const SAMPLE_CSV_TEMPLATE = `question,hindiQuestion,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation,examTag,examDate
"Which Indian Emperor issued the Rock Edicts? [SSC CGL 2018]","किस भारतीय सम्राट ने शिलालेख जारी किए?","Chandragupta Maurya","Ashoka The Great","Samudragupta","Harshavardhana","2","medium","Emperor Ashoka issued major and minor rock edicts across the Indian subcontinent.","SSC CGL Mains 2018","15-10-2018"
"The Right to Constitutional Remedies is under which Article? (UPSC Prelims 2021)","संवैधानिक उपचारों का अधिकार किस अनुच्छेद के तहत है?","Article 21","Article 19","Article 32","Article 14","3","easy","Article 32 was called the heart and soul of the Constitution by Dr. B.R. Ambedkar.","UPSC Prelims 2021","2021"
"Which river is known as the Sorrow of Bengal?","किस नदी को बंगाल का शोक कहा जाता है?","Damodar River","Hooghly River","Kosi River","Mahanadi River","1","easy","Damodar River was historically known as Sorrow of Bengal due to devastating floods.","",""`;

const SAMPLE_PIPE_TEMPLATE = `Which planet is closest to the Sun? [CHSL 2023] | सूर्य के सबसे निकट कौन सा ग्रह है? | Venus | Mercury | Mars | Earth | 2 | easy | Mercury is the smallest planet.
What is the SI unit of electric current? | विद्युत धारा का SI मात्रक क्या है? | Volt | Ohm | Ampere | Watt | 3 | easy | Ampere (A) is the base unit.`;

const SAMPLE_JSON_TEMPLATE = `[
  {
    "question": "Which article of the Indian Constitution deals with Fundamental Rights?",
    "options": ["Article 12-35", "Article 36-51", "Article 51A", "Article 1-4"],
    "correctAnswer": 0,
    "explanation": "Part III of the Constitution covers Articles 12 to 35 dealing with Fundamental Rights.",
    "difficulty": "medium",
    "examTag": "SSC CGL Mains 2018",
    "exam": "SSC CGL",
    "shift": "Mains",
    "year": 2018
  }
]`;

export const BulkImportMCQModal: React.FC<BulkImportMCQModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  defaultSubjectId = '',
  defaultTopicId = '',
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || subjects[0]?.id || ''
  );
  const availableTopics = topics.filter(
    (t) => !selectedSubjectId || t.subjectId === selectedSubjectId
  );
  const [selectedTopicId, setSelectedTopicId] = useState(
    defaultTopicId || availableTopics[0]?.id || ''
  );

  const [batchExamDate, setBatchExamDate] = useState('');
  const [batchExamTag, setBatchExamTag] = useState('');
  const [rawText, setRawText] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedMCQItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [purgeOldBeforeImport, setPurgeOldBeforeImport] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Parse CSV / Pipe / JSON separated text
  const parseInput = (text: string, bDate = '', bTag = ''): ParsedMCQItem[] => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const defaultDate = bDate.trim() || undefined;
    const defaultTag = bTag.trim() || undefined;

    // 1. JSON Array format detection
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsedJson = JSON.parse(trimmed.startsWith('{') ? `[${trimmed}]` : trimmed);
        if (Array.isArray(parsedJson)) {
          return parsedJson.map((item: any, idx: number) => {
            const rawQ = item.question || item.questionText || item.title || '';
            const detectedMeta = detectExamMetadata(rawQ);
            const question = detectedMeta.cleanQuestion || rawQ;

            let opts: [string, string, string, string] = ['', '', '', ''];
            if (Array.isArray(item.options)) {
              opts = [
                String(item.options[0] || ''),
                String(item.options[1] || ''),
                String(item.options[2] || ''),
                String(item.options[3] || ''),
              ];
            } else if (item.optionA || item.a) {
              opts = [
                String(item.optionA || item.a || item.optA || ''),
                String(item.optionB || item.b || item.optB || ''),
                String(item.optionC || item.c || item.optC || ''),
                String(item.optionD || item.d || item.optD || ''),
              ];
            }

            let correctIdx = 0;
            const rawAns = item.correctAnswer ?? item.correctOption ?? item.ans ?? item.answer;
            if (typeof rawAns === 'number') {
              correctIdx = rawAns >= 1 && rawAns <= 4 && !item.zeroIndexed ? rawAns - 1 : rawAns;
            } else if (typeof rawAns === 'string') {
              const u = rawAns.trim().toUpperCase();
              if (u === 'A' || u === '0' || u === '1') correctIdx = u === '1' && item.options ? 0 : (u === 'A' ? 0 : parseInt(u, 10));
              else if (u === 'B' || u === '2') correctIdx = 1;
              else if (u === 'C' || u === '3') correctIdx = 2;
              else if (u === 'D' || u === '4') correctIdx = 3;
            }

            const isValid = Boolean(question.trim() && opts[0].trim() && opts[1].trim());

            return {
              question,
              hindiQuestion: item.hindiQuestion || item.hindi || '',
              options: opts,
              correctOption: correctIdx >= 0 && correctIdx <= 3 ? correctIdx : 0,
              explanation: item.explanation || item.exp || '',
              difficulty: (item.difficulty === 'easy' || item.difficulty === 'hard') ? item.difficulty : 'medium',
              examTag: item.examTag || item.tag || detectedMeta.examTag || defaultTag,
              examDate: item.examDate || item.date || detectedMeta.examDate || defaultDate,
              exam: item.exam || detectedMeta.exam,
              shift: item.shift || detectedMeta.shift,
              year: item.year || detectedMeta.year,
              isValid,
              errorMessage: isValid ? undefined : `Item #${idx + 1} is missing question or options.`,
            };
          });
        }
      } catch {
        // Fall back to line by line parser
      }
    }

    // 2. Line by line CSV / Pipe parser
    const lines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const results: ParsedMCQItem[] = [];

    // Check if line 0 is a header
    let startIdx = 0;
    if (
      lines[0].toLowerCase().includes('question') &&
      (lines[0].includes('option') || lines[0].includes('correct') || lines[0].includes(','))
    ) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      let parts: string[] = [];

      // Pipe separated support
      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim());
      } else if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim());
      } else {
        // Standard CSV Parser with quotation support
        const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
        let match;
        const matches: string[] = [];
        while ((match = regex.exec(line)) !== null) {
          let val = match[1];
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          matches.push(val.trim());
          if (regex.lastIndex === line.length) break;
        }
        parts = matches;
      }

      if (parts.length < 6) {
        results.push({
          question: parts[0] || `Row #${i + 1}`,
          options: ['', '', '', ''],
          correctOption: 0,
          difficulty: 'medium',
          isValid: false,
          errorMessage: 'Row has fewer than 6 required columns (Question, 4 Options, Correct Answer).',
        });
        continue;
      }

      let q = '';
      let qHindi = '';
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let rawCorrect = '';
      let diff: 'easy' | 'medium' | 'hard' = 'medium';
      let exp = '';
      let explicitExamTag = '';
      let explicitExamDate = '';

      if (parts.length >= 11) {
        q = parts[0];
        qHindi = parts[1];
        optA = parts[2];
        optB = parts[3];
        optC = parts[4];
        optD = parts[5];
        rawCorrect = parts[6];
        const rawDiff = (parts[7] || '').toLowerCase();
        if (rawDiff.includes('easy')) diff = 'easy';
        else if (rawDiff.includes('hard')) diff = 'hard';
        else diff = 'medium';
        exp = parts[8] || '';
        explicitExamTag = parts[9] || '';
        explicitExamDate = parts[10] || '';
      } else if (parts.length >= 10) {
        q = parts[0];
        qHindi = parts[1];
        optA = parts[2];
        optB = parts[3];
        optC = parts[4];
        optD = parts[5];
        rawCorrect = parts[6];
        const rawDiff = (parts[7] || '').toLowerCase();
        if (rawDiff.includes('easy')) diff = 'easy';
        else if (rawDiff.includes('hard')) diff = 'hard';
        else diff = 'medium';
        exp = parts[8] || '';
        explicitExamTag = parts[9] || '';
      } else if (parts.length >= 9) {
        q = parts[0];
        qHindi = parts[1];
        optA = parts[2];
        optB = parts[3];
        optC = parts[4];
        optD = parts[5];
        rawCorrect = parts[6];
        const rawDiff = (parts[7] || '').toLowerCase();
        if (rawDiff.includes('easy')) diff = 'easy';
        else if (rawDiff.includes('hard')) diff = 'hard';
        else diff = 'medium';
        exp = parts[8] || '';
      } else if (parts.length === 8) {
        q = parts[0];
        qHindi = parts[1];
        optA = parts[2];
        optB = parts[3];
        optC = parts[4];
        optD = parts[5];
        rawCorrect = parts[6];
        exp = parts[7] || '';
      } else if (parts.length === 7) {
        q = parts[0];
        optA = parts[1];
        optB = parts[2];
        optC = parts[3];
        optD = parts[4];
        rawCorrect = parts[5];
        exp = parts[6] || '';
      } else {
        q = parts[0];
        optA = parts[1];
        optB = parts[2];
        optC = parts[3];
        optD = parts[4];
        rawCorrect = parts[5];
      }

      // Auto-Detect exam metadata from question (e.g. "[CGL mains 2018]" or "(chsl 2023)")
      const detectedMeta = detectExamMetadata(q);
      const cleanQ = detectedMeta.cleanQuestion;
      const finalExamTag = explicitExamTag || detectedMeta.examTag || defaultTag;
      const finalExamDate = explicitExamDate || detectedMeta.examDate || defaultDate;

      // Determine correct option (1-4, 0-3, A-D)
      let correctIdx = 0;
      const cleanCorrect = rawCorrect.trim().toUpperCase();
      if (cleanCorrect === 'A' || cleanCorrect === '1' || cleanCorrect === 'OPTION A') correctIdx = 0;
      else if (cleanCorrect === 'B' || cleanCorrect === '2' || cleanCorrect === 'OPTION B') correctIdx = 1;
      else if (cleanCorrect === 'C' || cleanCorrect === '3' || cleanCorrect === 'OPTION C') correctIdx = 2;
      else if (cleanCorrect === 'D' || cleanCorrect === '4' || cleanCorrect === 'OPTION D') correctIdx = 3;
      else {
        const parsedNum = parseInt(cleanCorrect, 10);
        if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 4) {
          correctIdx = parsedNum - 1;
        } else if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 3) {
          correctIdx = parsedNum;
        }
      }

      const isValid = Boolean(cleanQ.trim() && optA.trim() && optB.trim() && optC.trim() && optD.trim());

      results.push({
        question: cleanQ,
        hindiQuestion: qHindi,
        options: [optA, optB, optC, optD],
        correctOption: correctIdx,
        explanation: exp,
        difficulty: diff,
        examTag: finalExamTag,
        examDate: finalExamDate,
        exam: detectedMeta.exam,
        shift: detectedMeta.shift,
        year: detectedMeta.year,
        isValid,
        errorMessage: isValid ? undefined : 'Missing question or one of 4 options.',
      });
    }

    return results;
  };

  // Re-parse whenever rawText or batch metadata changes (debounced to avoid UI freeze)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = parseInput(rawText, batchExamDate, batchExamTag);
      setParsedItems(parsed);
    }, 120);
    return () => clearTimeout(timer);
  }, [rawText, batchExamDate, batchExamTag]);

  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'eduveda_mcq_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (!selectedSubjectId) return alert('Please select a target Subject');
    if (!selectedTopicId) return alert('Please select a target Topic');

    const validItems = parsedItems.filter((i) => i.isValid);
    if (validItems.length === 0) {
      return alert('No valid MCQs found in the input area.');
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: validItems.length });

    try {
      if (purgeOldBeforeImport && selectedTopicId) {
        await deleteMCQsByTopic(selectedTopicId);
      }

      const mcqsToUpload = validItems.map((item, idx) => ({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        question: item.question,
        hindiQuestion: item.hindiQuestion || '',
        options: item.options,
        correctAnswer: item.correctOption,
        difficulty: item.difficulty,
        explanation: item.explanation || '',
        examTag: item.examTag || batchExamTag.trim() || undefined,
        examDate: item.examDate || batchExamDate.trim() || undefined,
        exam: item.exam || undefined,
        shift: item.shift || undefined,
        year: item.year || undefined,
        published: true,
        order: idx + 1,
      }));

      setImportProgress({ current: Math.floor(validItems.length / 2), total: validItems.length });
      await addMCQsBatch(mcqsToUpload);
      setImportProgress({ current: validItems.length, total: validItems.length });

      alert(`🎉 Successfully imported ${validItems.length} MCQs smoothly into the Question Bank!`);
      onClose();
    } catch (err: any) {
      alert('Error importing questions: ' + err.message);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  if (!isOpen) return null;

  const validCount = parsedItems.filter((i) => i.isValid).length;
  const invalidCount = parsedItems.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10 sticky top-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Bulk Import MCQs (प्रश्नोत्तरी थोक आयात)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                Import dozens of multiple-choice questions at once using CSV, Excel copy-paste, or pipe-delimited text.
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Target Subject & Topic Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Subject (विषय) *</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  const avail = topics.filter((t) => t.subjectId === e.target.value);
                  setSelectedTopicId(avail[0]?.id || '');
                }}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold text-xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.hindiName ? `(${s.hindiName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Chapter / Topic (अध्याय) *</span>
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold text-xs"
              >
                {availableTopics.length === 0 ? (
                  <option value="">No topics found in this subject</option>
                ) : (
                  availableTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.hindiTitle ? `(${t.hindiTitle})` : ''}
                    </option>
                  ))
                )}
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
                  आयात से पहले इस टॉपिक के पुराने प्रश्न डिलीट करें (Purge / Delete existing MCQs in Topic)
                </span>
                <span className="text-[11px] text-rose-700">
                  चेक करने पर इस चुने हुए टॉपिक में मौजूद सभी पुराने प्रश्न डिलीट हो जाएंगे और केवल नए प्रश्न रहेंगे।
                </span>
              </div>
            </label>
          </div>

          {/* Dedicated Batch Exam Date & Tagging Field */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="font-extrabold text-amber-950 text-xs">
                  Batch Exam Date & Metadata Tag (संपूर्ण बैच हेतु परीक्षा दिनांक व नाम)
                </span>
              </div>
              <span className="text-[10px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md font-semibold">
                Optional for entire batch
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              यदि आप एक ही परीक्षा के कई प्रश्न अपलोड कर रहे हैं, तो नीचे <strong>Exam Date</strong> और <strong>Exam Tag</strong> दर्ज करें। यह सभी प्रश्नों में स्वचालित रूप से जुड़ जाएगा।
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Batch Exam Date / Year (परीक्षा दिनांक या वर्ष)</span>
                </label>
                <input
                  type="text"
                  placeholder="उदा. 15-10-2018 / 2023 / 15 March 2023"
                  value={batchExamDate}
                  onChange={(e) => setBatchExamDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Batch Exam Name / Shift (परीक्षा नाम व शिफ्ट)</span>
                </label>
                <input
                  type="text"
                  placeholder="उदा. SSC CGL Mains 2018 / UPSC Prelims 2021"
                  value={batchExamTag}
                  onChange={(e) => setBatchExamTag(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                />
              </div>
            </div>
          </div>

          {/* Quick Template Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold text-xs">
                Format: <code className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-mono">Question, Hindi Q, Opt A, Opt B, Opt C, Opt D, Correct (1-4), Difficulty, Explanation</code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyTemplate(SAMPLE_CSV_TEMPLATE)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 font-bold text-[11px] text-indigo-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTemplate ? 'Copied CSV!' : 'Copy CSV Template'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample .CSV</span>
              </button>
            </div>
          </div>

          {/* Text Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">
                Paste CSV or Structured Text Input:
              </label>
              <div className="flex items-center gap-2 text-[11px] flex-wrap">
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_JSON_TEMPLATE)}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Load Sample JSON
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_CSV_TEMPLATE)}
                  className="text-indigo-600 hover:underline"
                >
                  Load Sample CSV
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_PIPE_TEMPLATE)}
                  className="text-indigo-600 hover:underline"
                >
                  Load Pipe-Delimited
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-rose-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste questions here in CSV or pipe-delimited format..."
              className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 outline-hidden leading-relaxed resize-y"
            />
          </div>

          {/* Live Parser Preview Stats & Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                <span>Live Parsed Preview</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {parsedItems.length} Total
                </span>
              </h3>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{validCount} Ready to Import</span>
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{invalidCount} Invalid</span>
                  </span>
                )}
              </div>
            </div>

            {parsedItems.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
                No items detected. Paste your questions above to see the live breakdown.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 transition ${
                      item.isValid ? 'bg-white hover:bg-slate-50/80' : 'bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-400 text-[10px] font-mono">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {item.question}
                          </span>
                          {(item.examTag || item.examDate) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              <Award className="w-2.5 h-2.5 text-amber-600" />
                              {item.examTag || item.examDate}
                            </span>
                          )}
                        </div>
                        {item.hindiQuestion && (
                          <div className="text-[11px] text-indigo-600 font-medium truncate">
                            {item.hindiQuestion}
                          </div>
                        )}
                        {/* Options preview */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                          {item.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`px-2 py-1 rounded-lg truncate flex items-center gap-1.5 ${
                                oIdx === item.correctOption
                                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-400 font-mono">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span className="truncate">{opt || '(empty)'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            item.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.difficulty === 'hard'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.difficulty}
                        </span>
                        {item.isValid ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {importProgress ? (
              <span className="font-bold text-indigo-600 animate-pulse">
                Importing {importProgress.current} of {importProgress.total} MCQs into database...
              </span>
            ) : (
              <span>Ready to add {validCount} questions to selected chapter.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isImporting || validCount === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold flex items-center gap-2 transition shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isImporting ? 'Importing...' : `Import ${validCount} MCQs Now`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

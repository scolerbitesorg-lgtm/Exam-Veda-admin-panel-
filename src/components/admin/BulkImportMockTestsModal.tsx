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
  Layers,
  Clock,
  Award,
  RefreshCw,
} from 'lucide-react';
import type { Subject, Topic, MCQ, MockTest } from '../../types';
import { bulkInsertMockTests } from '../../services/dbService';

interface BulkImportMockTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  mcqs: MCQ[];
  onSuccess: () => void;
}

interface ParsedMockItem {
  title: string;
  description: string;
  duration: number;
  passingPercentage: number;
  tags: string[];
  questionCount: number;
  questionIds: string[];
  isValid: boolean;
  errorMessage?: string;
}

const SAMPLE_CSV = `title,duration,passingPercentage,tags,questionCount,description
"UPSC Prelims Full Mock 1",60,65,"UPSC, Prelims, Full Length",30,"Comprehensive exam simulation testing all GS subjects."
"Modern Indian History Sectional Test",30,60,"History, Freedom Movement",15,"Dedicated sectional mock test on 1857 to 1947 events."
"Indian Polity & Constitution Test",45,60,"Polity, Constitution, Judiciary",20,"Testing fundamental rights, DPSP, parliament and judicial review."`;

export const BulkImportMockTestsModal: React.FC<BulkImportMockTestsModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  mcqs,
  onSuccess,
}) => {
  const [inputText, setInputText] = useState(SAMPLE_CSV);
  const [parsedItems, setParsedItems] = useState<ParsedMockItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Helper to pick unique non-repeating MCQs
  const pickUniqueQuestions = (targetCount: number, tagKeywords: string[]): string[] => {
    let pool = [...mcqs.filter((m) => m.published !== false)];

    // If keywords match subject names, prioritize that subject
    const matchedSubject = subjects.find((s) =>
      tagKeywords.some((tag) => s.name.toLowerCase().includes(tag.toLowerCase()))
    );

    if (matchedSubject) {
      const subjectPool = pool.filter((m) => m.subjectId === matchedSubject.id);
      if (subjectPool.length >= targetCount) {
        pool = subjectPool;
      }
    }

    // Deduplicate
    const seenIds = new Set<string>();
    const seenQuestions = new Set<string>();
    const uniquePool: MCQ[] = [];

    for (const m of pool) {
      if (seenIds.has(m.id)) continue;
      const norm = m.question.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (seenQuestions.has(norm)) continue;

      seenIds.add(m.id);
      seenQuestions.add(norm);
      uniquePool.push(m);
    }

    // Shuffle and pick
    const shuffled = uniquePool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(targetCount, shuffled.length)).map((m) => m.id);
  };

  const handleParse = () => {
    setImportSuccess(null);
    if (!inputText.trim()) {
      alert('Please enter or paste CSV/JSON data');
      return;
    }

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    // Check if JSON format
    if (inputText.trim().startsWith('[') || inputText.trim().startsWith('{')) {
      try {
        const json = JSON.parse(inputText.trim());
        const arr = Array.isArray(json) ? json : [json];
        const parsed: ParsedMockItem[] = arr.map((item) => {
          const tags = Array.isArray(item.tags)
            ? item.tags
            : (item.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
          const qCount = Number(item.questionCount) || 20;
          const assignedIds =
            Array.isArray(item.questionIds) && item.questionIds.length > 0
              ? item.questionIds
              : pickUniqueQuestions(qCount, tags);

          const isValid = !!item.title && item.title.trim().length > 0;
          return {
            title: item.title || '',
            description: item.description || '',
            duration: Number(item.duration) || 30,
            passingPercentage: Number(item.passingPercentage) || 60,
            tags,
            questionCount: assignedIds.length,
            questionIds: assignedIds,
            isValid,
            errorMessage: isValid ? undefined : 'Missing test title',
          };
        });
        setParsedItems(parsed);
        return;
      } catch (err: any) {
        // Fallback to CSV
      }
    }

    // Parse CSV
    const rows: ParsedMockItem[] = [];
    const startIndex = lines[0].toLowerCase().includes('title') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV parse handling quotes
      const matches: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          matches.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      matches.push(current.trim());

      const title = matches[0]?.replace(/^"|"$/g, '').trim() || '';
      const duration = Number(matches[1]?.replace(/^"|"$/g, '').trim()) || 30;
      const passingPercentage = Number(matches[2]?.replace(/^"|"$/g, '').trim()) || 60;
      const rawTags = matches[3]?.replace(/^"|"$/g, '').trim() || '';
      const tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
      const questionCount = Number(matches[4]?.replace(/^"|"$/g, '').trim()) || 15;
      const description = matches[5]?.replace(/^"|"$/g, '').trim() || 'Comprehensive mock test examination.';

      const assignedQIds = pickUniqueQuestions(questionCount, tags);
      const isValid = !!title;

      rows.push({
        title,
        description,
        duration,
        passingPercentage,
        tags,
        questionCount: assignedQIds.length,
        questionIds: assignedQIds,
        isValid,
        errorMessage: isValid ? undefined : 'Title is missing in row',
      });
    }

    setParsedItems(rows);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_CSV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedItems.filter((p) => p.isValid && p.questionIds.length > 0);
    if (validRows.length === 0) {
      alert('No valid mock tests to import. Please check parsed rows.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const mockList: Omit<MockTest, 'id'>[] = validRows.map((v) => ({
        title: v.title,
        description: v.description,
        duration: v.duration,
        passingPercentage: v.passingPercentage,
        tags: v.tags,
        questionIds: v.questionIds,
        published: true,
        createdAt: now,
        updatedAt: now,
      }));

      const res = await bulkInsertMockTests(mockList);
      setImportSuccess(`Successfully imported ${res.insertedCount} mock tests into database!`);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert('Error importing mock tests: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Bulk Import Mock Tests (थोक मॉक टेस्ट जोड़ें)
              </h2>
              <p className="text-xs text-slate-500">
                CSV या JSON से एक साथ कई मॉक टेस्ट बनाएं। प्रश्न मौजूदा बैंक से ऑटो-असाइन हो जाएंगे।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {importSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Sample template actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">CSV Columns:</span>
              <code className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-purple-700">
                title, duration, passingPercentage, tags, questionCount, description
              </code>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySample}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] flex items-center gap-1 shadow-2xs"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Sample'}</span>
              </button>

              <label className="px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs">
                <FileSpreadsheet className="w-3 h-3" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Paste CSV / JSON Content below:
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste comma separated rows or JSON array..."
              className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-hidden leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleParse}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-200 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Parse & Validate Mock Tests</span>
            </button>
          </div>

          {/* Parsed Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">
                  Parsed Mock Tests ({parsedItems.filter((p) => p.isValid).length} Valid / {parsedItems.length} Total)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Unique Questions will be assigned from {mcqs.length} MCQs
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                      item.isValid
                        ? 'bg-white border-slate-200'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        <span>⏳ {item.duration} Mins</span>
                        <span>•</span>
                        <span>🎯 Pass: {item.passingPercentage}%</span>
                        <span>•</span>
                        <span className="font-bold text-indigo-600">
                          ✓ {item.questionIds.length} Unique MCQs Linked
                        </span>
                      </div>
                    </div>

                    <div>
                      {item.isValid ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Ready
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          {item.errorMessage || 'Invalid'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isSubmitting || parsedItems.filter((p) => p.isValid).length === 0}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-purple-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import {parsedItems.filter((p) => p.isValid).length} Mock Tests</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

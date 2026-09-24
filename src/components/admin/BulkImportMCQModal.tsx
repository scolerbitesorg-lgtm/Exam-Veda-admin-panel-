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
} from 'lucide-react';
import type { Subject, Topic } from '../../types';
import { addMCQ } from '../../services/dbService';

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
  isValid: boolean;
  errorMessage?: string;
}

const SAMPLE_CSV_TEMPLATE = `question,hindiQuestion,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation
"Which Indian Emperor issued the Rock Edicts?","किस भारतीय सम्राट ने शिलालेख जारी किए?","Chandragupta Maurya","Ashoka The Great","Samudragupta","Harshavardhana","2","medium","Emperor Ashoka issued major and minor rock edicts across the Indian subcontinent."
"The Right to Constitutional Remedies is under which Article?","संवैधानिक उपचारों का अधिकार किस अनुच्छेद के तहत है?","Article 21","Article 19","Article 32","Article 14","3","easy","Article 32 was called the heart and soul of the Constitution by Dr. B.R. Ambedkar."
"Which river is known as the Sorrow of Bengal?","किस नदी को बंगाल का शोक कहा जाता है?","Damodar River","Hooghly River","Kosi River","Mahanadi River","1","easy","Damodar River was historically known as Sorrow of Bengal due to devastating floods."`;

const SAMPLE_PIPE_TEMPLATE = `Which planet is closest to the Sun? | सूर्य के सबसे निकट कौन सा ग्रह है? | Venus | Mercury | Mars | Earth | 2 | easy | Mercury is the smallest and innermost planet in the Solar System.
What is the SI unit of electric current? | विद्युत धारा का SI मात्रक क्या है? | Volt | Ohm | Ampere | Watt | 3 | easy | Ampere (A) is the base SI unit of electric current.`;

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

  const [rawText, setRawText] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedMCQItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Parse CSV / Pipe separated text
  const parseInput = (text: string): ParsedMCQItem[] => {
    if (!text.trim()) return [];
    const lines = text
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

      // Column mappings:
      // If 9 columns: [question, hindiQuestion, optA, optB, optC, optD, correctAns, difficulty, explanation]
      // If 8 columns: [question, hindiQuestion, optA, optB, optC, optD, correctAns, explanation]
      // If 7 columns: [question, optA, optB, optC, optD, correctAns, explanation]
      // If 6 columns: [question, optA, optB, optC, optD, correctAns]

      let q = '';
      let qHindi = '';
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let rawCorrect = '';
      let diff: 'easy' | 'medium' | 'hard' = 'medium';
      let exp = '';

      if (parts.length >= 9) {
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

      const isValid = Boolean(q.trim() && optA.trim() && optB.trim() && optC.trim() && optD.trim());

      results.push({
        question: q,
        hindiQuestion: qHindi,
        options: [optA, optB, optC, optD],
        correctOption: correctIdx,
        explanation: exp,
        difficulty: diff,
        isValid,
        errorMessage: isValid ? undefined : 'Missing question or one of 4 options.',
      });
    }

    return results;
  };

  // Re-parse whenever rawText changes
  React.useEffect(() => {
    const parsed = parseInput(rawText);
    setParsedItems(parsed);
  }, [rawText]);

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
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        await addMCQ({
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          question: item.question,
          hindiQuestion: item.hindiQuestion || '',
          options: item.options,
          correctAnswer: item.correctOption,
          difficulty: item.difficulty,
          explanation: item.explanation || '',
          published: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setImportProgress({ current: i + 1, total: validItems.length });
      }

      alert(`🎉 Successfully imported ${validItems.length} MCQs into the Question Bank!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Bulk Import MCQs (प्रश्नोत्तरी थोक आयात)
              </h2>
              <p className="text-xs text-slate-500">
                Import dozens of multiple-choice questions at once using CSV, Excel copy-paste, or pipe-delimited text.
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

        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
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
              <div className="flex items-center gap-2 text-[11px]">
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
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-400 text-[10px] font-mono">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {item.question}
                          </span>
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

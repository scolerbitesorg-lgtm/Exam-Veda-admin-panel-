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
  ArrowRight,
  BookOpen,
  Award,
  Clock,
  HelpCircle,
} from 'lucide-react';
import type { Subject, Topic, MCQ } from '../../types';
import { addMockTest } from '../../services/dbService';

interface BulkImportMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  mcqs: MCQ[];
  onSuccess?: () => void;
}

interface ParsedMockQuestion {
  question: string;
  hindiQuestion?: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const SAMPLE_CSV_MOCK = `question,hindiQuestion,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation
"Who among the following was the founder of the Maurya Dynasty?","मौर्य वंश के संस्थापक निम्नलिखित में से कौन थे?","Ashoka","Chandragupta Maurya","Bindusara","Brihadratha","2","easy","Chandragupta Maurya founded the Maurya Empire in 322 BCE with the help of Chanakya."
"Which article of the Indian Constitution deals with the Fundamental Duties?","भारतीय संविधान का कौन सा अनुच्छेद मौलिक कर्तव्यों से संबंधित है?","Article 51A","Article 19","Article 21","Article 32","1","easy","Fundamental duties were incorporated in Article 51A by the 42nd Amendment in 1976."
"In which year was the Reserve Bank of India nationalized?","भारतीय रिजर्व बैंक का राष्ट्रीयकरण किस वर्ष हुआ था?","1935","1947","1949","1950","3","medium","RBI was established in 1935 and nationalized on January 1, 1949."
"What is the capital of Australia?","ऑस्ट्रेलिया की राजधानी क्या है?","Sydney","Melbourne","Canberra","Brisbane","3","easy","Canberra is the federal capital of Australia."
"Which gas is primarily responsible for the Greenhouse Effect?","ग्रीनहाउस प्रभाव के लिए मुख्य रूप से कौन सी गैस जिम्मेदार है?","Carbon Dioxide","Methane","Oxygen","Nitrogen","1","easy","Carbon dioxide contributes significantly to the greenhouse effect."`;

export const BulkImportMockTestModal: React.FC<BulkImportMockTestModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  mcqs,
  onSuccess,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [testTitle, setTestTitle] = useState('');
  const [testHindiTitle, setTestHindiTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.33);

  const [rawText, setRawText] = useState(SAMPLE_CSV_MOCK);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  // Parse CSV questions for the mock test
  const parseQuestions = (text: string): ParsedMockQuestion[] => {
    if (!text.trim()) return [];
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const questions: ParsedMockQuestion[] = [];
    const seenQuestions = new Set<string>();

    let startIdx = 0;
    if (lines[0].toLowerCase().includes('question') && lines[0].includes('option')) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      let parts: string[] = [];

      if (line.includes('|')) {
        parts = line.split('|').map((p) => p.trim());
      } else {
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

      if (parts.length < 6) continue;

      let q = parts[0] || '';
      let qHindi = parts[1] || '';
      let optA = parts[2] || '';
      let optB = parts[3] || '';
      let optC = parts[4] || '';
      let optD = parts[5] || '';
      let rawCorrect = parts[6] || '1';
      let diff: 'easy' | 'medium' | 'hard' = 'medium';
      let expl = parts[8] || parts[7] || '';

      if (parts.length === 6) {
        q = parts[0];
        optA = parts[1];
        optB = parts[2];
        optC = parts[3];
        optD = parts[4];
        rawCorrect = parts[5];
      } else if (parts.length === 7) {
        q = parts[0];
        optA = parts[1];
        optB = parts[2];
        optC = parts[3];
        optD = parts[4];
        rawCorrect = parts[5];
        expl = parts[6];
      }

      // Deduplicate check
      const normalizedQ = q.trim().toLowerCase();
      if (seenQuestions.has(normalizedQ)) continue;
      seenQuestions.add(normalizedQ);

      let correctIndex = 0;
      const cleanCorrect = rawCorrect.trim().toUpperCase();
      if (cleanCorrect === '1' || cleanCorrect === 'A' || cleanCorrect === 'OPTION A' || cleanCorrect === '0') correctIndex = 0;
      else if (cleanCorrect === '2' || cleanCorrect === 'B' || cleanCorrect === 'OPTION B' || cleanCorrect === '1') correctIndex = 1;
      else if (cleanCorrect === '3' || cleanCorrect === 'C' || cleanCorrect === 'OPTION C' || cleanCorrect === '2') correctIndex = 2;
      else if (cleanCorrect === '4' || cleanCorrect === 'D' || cleanCorrect === 'OPTION D' || cleanCorrect === '3') correctIndex = 3;

      if (q && optA && optB && optC && optD) {
        questions.push({
          question: q,
          hindiQuestion: qHindi || undefined,
          options: [optA, optB, optC, optD],
          correctAnswer: correctIndex,
          explanation: expl || 'Answer explained.',
          difficulty: diff,
        });
      }
    }

    return questions;
  };

  const parsedQuestions = parseQuestions(rawText);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV_MOCK);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleImport = async () => {
    if (!testTitle.trim()) return alert('Please enter a Mock Test Title');
    if (parsedQuestions.length === 0) return alert('No valid questions parsed from the data.');

    setIsImporting(true);
    try {
      const totalScore = parsedQuestions.length * marksPerQuestion;
      const passScore = Math.ceil(totalScore * 0.4);

      // Create full mock test with unique embedded questions and IDs
      const fullQuestions = parsedQuestions.map((pq, idx) => ({
        id: `mock_q_${Date.now()}_${idx}`,
        subjectId: selectedSubjectId,
        topicId: 'bulk_mock_topic',
        question: pq.question,
        hindiQuestion: pq.hindiQuestion,
        options: pq.options,
        correctAnswer: pq.correctAnswer,
        explanation: pq.explanation || '',
        difficulty: pq.difficulty || 'medium',
        published: true,
        order: idx + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await addMockTest({
        title: testTitle.trim(),
        hindiTitle: testHindiTitle.trim() || undefined,
        description: testDescription.trim() || `Comprehensive mock exam with ${parsedQuestions.length} questions.`,
        subjectId: selectedSubjectId,
        duration: Number(durationMinutes) || 30,
        durationMinutes: Number(durationMinutes) || 30,
        totalMarks: totalScore,
        passingMarks: passScore,
        negativeMarking: Number(negativeMarking) || 0,
        questionIds: fullQuestions.map((q) => q.id),
        questions: fullQuestions,
        published: true,
        isFree: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setImportSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('Failed to import mock test: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                Bulk Import Mock Test & Questions (CSV/Text)
              </h2>
              <p className="text-[11px] text-slate-500">
                Paste 10 to 100+ questions at once to create a complete mock test with auto-deduplication.
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

        {importSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Mock Test & Questions Imported Successfully!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Test <strong className="text-indigo-600">"{testTitle}"</strong> containing{' '}
              <strong>{parsedQuestions.length} unique questions</strong> has been added and published.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200"
              >
                Done & View Mock Tests
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            {/* Test Metadata */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Mock Test Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPSC Prelims 2026 GS Paper 1 Mock"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-500 text-xs font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Primary Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-500 text-xs bg-white"
                  >
                    <option value="">All / General Syllabus</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon || '📚'} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marks per Q</label>
                  <input
                    type="number"
                    min="1"
                    value={marksPerQuestion}
                    onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-200/70 text-slate-800 font-bold font-mono text-xs">
                    {parsedQuestions.length * marksPerQuestion} Marks
                  </div>
                </div>
              </div>
            </div>

            {/* Paste Data Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  Paste CSV / Pipe Separated Questions Data:
                </label>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="text-[11px] text-purple-700 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedTemplate ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTemplate ? 'Template Copied!' : 'Copy CSV Template'}</span>
                </button>
              </div>

              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:border-purple-500 font-mono text-[11px] leading-relaxed"
              />
            </div>

            {/* Live Parsing Preview & Deduplication Stats */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Valid Unique Questions Parsed:</span>
                  <strong className="text-purple-700 text-sm font-extrabold ml-1">
                    {parsedQuestions.length}
                  </strong>
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Duplicate rows and invalid questions are automatically removed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Zero Duplicates
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || parsedQuestions.length === 0 || !testTitle.trim()}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold flex items-center gap-2 shadow-md shadow-purple-200 disabled:opacity-50 transition"
              >
                {isImporting ? (
                  <span>Importing Questions...</span>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Import Mock Test ({parsedQuestions.length} Questions)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

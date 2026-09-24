import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { Subject } from '../../types';
import { addSubject } from '../../services/dbService';

interface BulkImportSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSubjectsCount: number;
}

interface ParsedSubjectItem {
  name: string;
  hindiName?: string;
  description?: string;
  color?: string;
  order: number;
  isValid: boolean;
}

const SAMPLE_SUBJECTS_CSV = `name,hindiName,description,color,order
"Ancient Indian History","प्राचीन भारत का इतिहास","Comprehensive coverage of Indus Valley, Vedic Era, and Mauryan Empire","#4f46e5",1
"Indian Polity & Governance","भारतीय राजव्यवस्था एवं शासन","Constitutional framework, Fundamental Rights, and Parliamentary procedures","#0284c7",2
"Physical & World Geography","भौतिक एवं विश्व भूगोल","Geomorphology, climatology, oceanography, and economic geography","#059669",3
"Indian Economy","भारतीय अर्थव्यवस्था","Macroeconomics, fiscal policy, inflation, banking systems, and union budgets","#d97706",4
"General Science & Tech","सामान्य विज्ञान एवं प्रौद्योगिकी","Physics, chemistry, biology, space technology, and AI innovations","#9333ea",5`;

export const BulkImportSubjectsModal: React.FC<BulkImportSubjectsModalProps> = ({
  isOpen,
  onClose,
  existingSubjectsCount,
}) => {
  const [rawText, setRawText] = useState(SAMPLE_SUBJECTS_CSV);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedSubjectItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const parseSubjectsInput = (text: string): ParsedSubjectItem[] => {
    if (!text.trim()) return [];
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const results: ParsedSubjectItem[] = [];
    let startIdx = 0;
    if (
      lines[0].toLowerCase().includes('name') &&
      (lines[0].includes('hindi') || lines[0].includes('color') || lines[0].includes(','))
    ) {
      startIdx = 1;
    }

    const defaultColors = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#9333ea', '#e11d48', '#0d9488'];

    const defaultEmojis = ['📚', '🏛️', '🌍', '📊', '🔬', '⚖️', '💻', '🧠', '💡', '📜'];

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

      if (parts.length === 0 || !parts[0].trim()) continue;

      const name = parts[0] || '';
      const hindiName = parts[1] || '';
      const description = parts[2] || '';
      const color = parts[3] || defaultColors[(existingSubjectsCount + i) % defaultColors.length];
      const parsedOrder = parseInt(parts[4] || '', 10);
      const order = isNaN(parsedOrder) ? existingSubjectsCount + results.length + 1 : parsedOrder;
      const emoji = defaultEmojis[(existingSubjectsCount + results.length) % defaultEmojis.length];

      results.push({
        name,
        hindiName,
        description,
        color,
        order,
        isValid: Boolean(name.trim()),
      });
    }

    return results;
  };

  React.useEffect(() => {
    setParsedItems(parseSubjectsInput(rawText));
  }, [rawText]);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_SUBJECTS_CSV);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([SAMPLE_SUBJECTS_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'eduveda_subjects_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    const validItems = parsedItems.filter((i) => i.isValid);
    if (validItems.length === 0) return alert('No valid subjects found to import');

    setIsImporting(true);
    try {
      const defaultEmojis = ['📚', '🏛️', '🌍', '📊', '🔬', '⚖️', '💻', '🧠', '💡', '📜'];
      let idx = 0;
      for (const item of validItems) {
        const itemEmoji = defaultEmojis[(existingSubjectsCount + idx) % defaultEmojis.length];
        await addSubject({
          name: item.name,
          hindiName: item.hindiName || '',
          description: item.description || '',
          color: item.color || '#4f46e5',
          icon: itemEmoji,
          image: '',
          order: item.order,
          published: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        idx++;
      }

      alert(`🎉 Successfully imported ${validItems.length} Subjects!`);
      onClose();
    } catch (err: any) {
      alert('Error importing subjects: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const validCount = parsedItems.filter((i) => i.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Bulk Import Subjects (विषय थोक आयात)
              </h2>
              <p className="text-xs text-slate-500">
                Quickly add multiple academic courses or subjects at once using CSV or structured text.
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

        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900">
            <span className="font-semibold text-xs">
              Format: <code className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-mono">name, hindiName, description, color, order</code>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 font-bold text-[11px] text-indigo-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTemplate ? 'Copied!' : 'Copy Template'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Paste CSV / Structured Lines:
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:border-indigo-500 outline-hidden leading-relaxed"
            />
          </div>

          {/* Preview list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-xs">
                Parsed Subjects Preview ({parsedItems.length})
              </h3>
              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{validCount} Valid</span>
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: item.color || '#4f46e5' }}
                    >
                      {item.name ? item.name.charAt(0) : '#'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      {item.hindiName && (
                        <div className="text-[10px] text-indigo-600 font-medium">
                          {item.hindiName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">Order: {item.order}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isImporting || validCount === 0}
            onClick={handleExecuteImport}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-200 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isImporting ? 'Importing...' : `Import ${validCount} Subjects`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

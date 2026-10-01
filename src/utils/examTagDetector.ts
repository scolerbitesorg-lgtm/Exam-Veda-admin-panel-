/**
 * Exam Tag & Date Auto-Detector Utility
 * Automatically extracts past paper info, exam name, shift, year, and date from MCQ text.
 * If no exam details are present, it smoothly returns undefined (100% optional).
 */

export interface DetectedExamInfo {
  cleanQuestion: string;
  examTag?: string;
  examDate?: string;
  exam?: string;
  shift?: string;
  year?: number | string;
}

const COMMON_EXAM_PATTERNS = [
  'ssc cgl',
  'ssc chsl',
  'ssc cpo',
  'ssc mts',
  'ssc gd',
  'ssc steno',
  'ssc',
  'cgl mains',
  'cgl pre',
  'cgl',
  'chsl',
  'cpo',
  'mts',
  'upsc cse',
  'upsc prelims',
  'upsc mains',
  'upsc cds',
  'upsc nda',
  'upsc capf',
  'upsc',
  'rrb ntpc',
  'rrb group d',
  'rrb alp',
  'rrb je',
  'rrb',
  'railway',
  'bpsc',
  'uppsc',
  'mppsc',
  'ras',
  'ukpsc',
  'jpsc',
  'wbcs',
  'hpsc',
  'ctet',
  'uptet',
  'reet',
  'dsssb',
  'kvs',
  'nvs',
  'afcat',
  'cds',
  'nda',
  'sbi po',
  'sbi clerk',
  'ibps po',
  'ibps clerk',
  'rbi grade b',
  'ugc net',
];

export function isLikelyExamTag(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  
  if (lower.startsWith('ex-') || lower.startsWith('exam') || lower.startsWith('date')) {
    return true;
  }

  for (const pattern of COMMON_EXAM_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }

  // Check if contains year (1990-2035) or date pattern
  if (/\b(19[89]\d|20[0-3]\d)\b/.test(lower)) return true;
  if (/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/.test(lower)) return true;

  return false;
}

/**
 * Extracts exam tag and date from raw question string or separate block lines.
 */
export function detectExamMetadata(
  rawQuestionText: string,
  associatedLines: string[] = []
): DetectedExamInfo {
  let examTag: string | undefined = undefined;
  let examDate: string | undefined = undefined;
  let exam: string | undefined = undefined;
  let shift: string | undefined = undefined;
  let year: number | string | undefined = undefined;
  let cleanQuestion = (rawQuestionText || '').trim();

  // 1. Check dedicated lines first (e.g. "Exam: CGL Mains 2018", "Date: 15-08-2023", "Tag: SSC CHSL 2023", "[CGL mains 2018]", "(ex- chsl 2023)")
  for (const line of associatedLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const examLineMatch = trimmed.match(/^\s*(?:Exam(?:\s*Name|\s*Tag)?|परीक्षा|Ex)[\s\.:\)\-]+(.*)/i);
    const dateLineMatch = trimmed.match(/^\s*(?:Date|Exam\s*Date|दिनांक|तारीख)[\s\.:\)\-]+(.*)/i);
    const shiftLineMatch = trimmed.match(/^\s*(?:Shift|पाली|सत्र|Tier|Stage)[\s\.:\)\-]+(.*)/i);
    const bracketMatch = trimmed.match(/^\s*(?:\[|\()(?:\s*(?:ex-?\s*)?)(.*?)[\)\]]\s*$/i);

    if (examLineMatch && examLineMatch[1].trim()) {
      examTag = examLineMatch[1].trim();
    }
    if (dateLineMatch && dateLineMatch[1].trim()) {
      examDate = dateLineMatch[1].trim();
    }
    if (shiftLineMatch && shiftLineMatch[1].trim()) {
      shift = shiftLineMatch[1].trim();
    }
    if (bracketMatch && bracketMatch[1].trim()) {
      const inside = bracketMatch[1].trim();
      if (!examTag && isLikelyExamTag(inside)) {
        examTag = inside.replace(/^ex-?\s*/i, '').trim();
      }
    }
  }

  // 2. Check brackets/parentheses inside question text:
  // e.g. "Q1. What is the SI unit? [CGL mains 2018]"
  // e.g. "Q1. What is the SI unit? (ex- chsl 2023)"
  // e.g. "Q1. What is the SI unit? [CHSL 2023, 15 March]"
  // e.g. "Q1. What is the SI unit? [Exam Date: 12-08-2023]"
  const bracketRegex = /(?:\[|\()([^[\]\(\)]*?(?:cgl|chsl|cpo|mts|ssc|upsc|rrb|ntpc|railway|pcs|bpsc|uppsc|mppsc|ras|nda|cds|capf|ctet|uptet|mains|pre|prelims|tier|shift|date|year|20\d\d|19\d\d|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})[^[\]\(\)]*?)(?:\]|\))/gi;

  let match;
  while ((match = bracketRegex.exec(cleanQuestion)) !== null) {
    const rawTag = match[1].trim();
    if (rawTag && rawTag.length >= 3 && rawTag.length <= 100) {
      if (!examTag) {
        examTag = rawTag.replace(/^ex-?\s*/i, '').replace(/^exam\s*(?:date)?[\s\:]*/i, '').trim();
      }
      // Strip tag from question text cleanly
      cleanQuestion = cleanQuestion.replace(match[0], '').trim();
    }
  }

  // 3. Normalize & extract sub-fields if examTag is found
  if (examTag) {
    // Clean prefix like "ex- "
    examTag = examTag.replace(/^ex-?\s*/i, '').trim();

    // Extract Year (1980-2035)
    const yearMatch = examTag.match(/\b(19[89]\d|20[0-3]\d)\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
      if (!examDate) {
        examDate = yearMatch[1];
      }
    }

    // Extract full date if present (e.g. 15-10-2018, 15/10/2023, 15 March 2023)
    const dateMatch = examTag.match(
      /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i
    );
    if (dateMatch) {
      examDate = dateMatch[0];
    }

    // Extract Shift (Mains, Prelims, Tier 1, Tier 2, Shift 1, Shift 2, Morning, Evening)
    const shiftMatch = examTag.match(
      /\b(Mains|Prelims|Pre|Tier[\s\-]*[1-4]|Shift[\s\-]*[1-4]|Stage[\s\-]*[1-2]|CBT[\s\-]*[1-2]|Morning|Evening)\b/i
    );
    if (shiftMatch) {
      shift = shiftMatch[0];
    }

    // Extract Exam Name
    const examMatch = examTag.match(
      /\b(SSC\s+CGL|SSC\s+CHSL|SSC\s+CPO|SSC\s+MTS|SSC\s+GD|SSC\s+Steno|SSC|UPSC\s+CSE|UPSC\s+CDS|UPSC\s+NDA|UPSC|RRB\s+NTPC|RRB\s+Group\s+D|RRB\s+ALP|RRB|BPSC|UPPSC|MPPSC|RAS|CTET|UPTET|DSSSB|AFCAT|SBI\s+PO|IBPS\s+PO|CGL|CHSL|CPO|MTS|NTPC)\b/i
    );
    if (examMatch) {
      exam = examMatch[0].toUpperCase();
    }
  }

  // Clean trailing punctuation or excessive whitespace
  cleanQuestion = cleanQuestion.replace(/\s+/g, ' ').replace(/\s+([,\.\?\!])/g, '$1').trim();

  return {
    cleanQuestion: cleanQuestion || rawQuestionText,
    examTag: examTag || undefined,
    examDate: examDate || undefined,
    exam: exam || undefined,
    shift: shift || undefined,
    year: year || undefined,
  };
}

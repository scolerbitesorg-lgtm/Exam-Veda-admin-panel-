import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  FeatureRegistryItem,
  AuditLogEntry,
  SystemErrorLog,
  CustomRole,
  NotificationBroadcast,
} from '../types';

// ============================================================================
// 1. DEFAULT MASTER FEATURE REGISTRY (18 Advanced Modules)
// ============================================================================
export const DEFAULT_FEATURE_REGISTRY: FeatureRegistryItem[] = [
  {
    id: 'ai-control-center',
    name: 'AI Control Center (Multi-Provider Engine)',
    description: 'Manage Gemini, Groq, OpenRouter, OpenAI, Anthropic, API keys, auto-failover, model switching, and real-time request logs.',
    category: 'AI',
    status: 'active',
    version: '2.4.0',
    enabled: true,
    addedDate: '2026-03-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'High speed Groq LPU (llama-3.3-70b) and Gemini 2.5 Flash active with auto failover.',
    tags: ['Groq', 'Gemini', 'Failover', 'Token Usage'],
  },
  {
    id: 'ai-prompt-manager',
    name: 'AI Prompt Manager & Version History',
    description: 'Central prompt engineering studio for MCQs, Notes, Explanations, Mock Tests, Doubt Solvers, and Translation prompts with rollback.',
    category: 'AI',
    status: 'active',
    version: '2.1.0',
    enabled: true,
    addedDate: '2026-03-10',
    lastUpdated: '2026-09-23',
    developerNotes: 'Customized system and student instructions with live testing sandbox and version snapshots.',
    tags: ['Prompts', 'Version History', 'Rollback', 'Testing Sandbox'],
  },
  {
    id: 'user-management-advanced',
    name: 'User Management Advanced (Telemetry & Security)',
    description: 'Track student activity, login devices, AI doubt quota, single-device enforcement, ban/unban controls, and permission overrides.',
    category: 'Users',
    status: 'active',
    version: '2.0.0',
    enabled: true,
    addedDate: '2026-03-15',
    lastUpdated: '2026-09-23',
    developerNotes: 'Realtime device fingerprinting and single-device login session epoch tracking.',
    tags: ['Telemetry', 'Anti-Sharing', 'Ban Controls', 'Device Tracking'],
  },
  {
    id: 'role-permission-manager',
    name: 'Role & Permission Manager (RBAC Matrix)',
    description: 'Granular Access Control matrix for View, Create, Edit, Delete, Publish, AI Access, and Developer Master permissions.',
    category: 'Roles',
    status: 'active',
    version: '1.8.0',
    enabled: true,
    addedDate: '2026-03-20',
    lastUpdated: '2026-09-23',
    developerNotes: 'Enforces permission guards on client and Firestore database levels.',
    tags: ['RBAC', 'Permissions', 'Custom Roles', 'Security Matrix'],
  },
  {
    id: 'content-control-center',
    name: 'Content Control Center (Bulk Actions & Drafts)',
    description: 'Batch publish/unpublish, scheduled release manager, multi-level hierarchy filter, duplicate content detector, and revision snapshots.',
    category: 'Content',
    status: 'active',
    version: '1.9.0',
    enabled: true,
    addedDate: '2026-04-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'Bulk operations with real-time atomic Firestore batch writes.',
    tags: ['Bulk Publish', 'Scheduled Release', 'Duplicate Check', 'Drafts'],
  },
  {
    id: 'advanced-mcq-tools',
    name: 'Advanced MCQ Tools & AI Generator',
    description: 'Bulk CSV/JSON importer, AI Question generator by syllabus, difficulty tagging, PYQ exam year tagging, and duplicate question scanner.',
    category: 'MCQs',
    status: 'active',
    version: '2.2.0',
    enabled: true,
    addedDate: '2026-04-10',
    lastUpdated: '2026-09-23',
    developerNotes: 'AI validation checks question wording, 4 distinct options, and detailed step-by-step Hindi/English explanation.',
    tags: ['AI MCQs', 'Difficulty Tagging', 'Validation', 'PYQ Tagging'],
  },
  {
    id: 'advanced-mock-test-tools',
    name: 'Advanced Mock Test Tools & Generator',
    description: 'Template blueprints, automatic question randomization, difficulty distribution, negative marking rules, and attempt limits.',
    category: 'Tests',
    status: 'active',
    version: '2.0.0',
    enabled: true,
    addedDate: '2026-04-20',
    lastUpdated: '2026-09-23',
    developerNotes: 'NTA Exam pattern emulator with timer configurations and live rank algorithm.',
    tags: ['Mock Blueprints', 'Randomization', 'Negative Marking', 'NTA UI'],
  },
  {
    id: 'analytics-center',
    name: 'Analytics Center (Engagement & Accuracy)',
    description: 'Deep dive metrics on student study hours, most attempted tests, weak topics analysis, subject popularity, and AI token velocity.',
    category: 'Analytics',
    status: 'active',
    version: '2.3.0',
    enabled: true,
    addedDate: '2026-05-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'Aggregated analytics generated from mock attempts and study progress docs.',
    tags: ['Engagement', 'Weak Topics', 'Score Trends', 'AI Consumption'],
  },
  {
    id: 'system-health',
    name: 'System Health & Latency Monitor',
    description: 'Real-time telemetry for Firestore read/write latency, Firebase Auth status, Storage ping, and AI Provider response times.',
    category: 'System',
    status: 'active',
    version: '1.5.0',
    enabled: true,
    addedDate: '2026-05-15',
    lastUpdated: '2026-09-23',
    developerNotes: 'Continuous health check benchmark with automatic degraded state alerts.',
    tags: ['Latency', 'Health Check', 'Firebase Status', 'Uptime'],
  },
  {
    id: 'error-center',
    name: 'Error Center & Resolution Hub',
    description: 'Unified error log capturing Frontend, Backend, AI API, Database, and Network failures with search, filter, and resolution status.',
    category: 'Errors',
    status: 'active',
    version: '1.7.0',
    enabled: true,
    addedDate: '2026-06-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'Categorized error triage dashboard with stack trace inspect and mark as resolved flow.',
    tags: ['Crash Triage', 'API Errors', 'Network Faults', 'Resolution'],
  },
  {
    id: 'audit-log',
    name: 'Audit Log & Change Tracker',
    description: 'Immutable security log tracking all admin actions: Who changed what, old value vs new value, timestamps, and target resources.',
    category: 'Audit',
    status: 'active',
    version: '2.0.0',
    enabled: true,
    addedDate: '2026-06-15',
    lastUpdated: '2026-09-23',
    developerNotes: 'Persists security-sensitive events with JSON / CSV export capabilities.',
    tags: ['Security Log', 'Compliance', 'Change History', 'Export'],
  },
  {
    id: 'backup-recovery',
    name: 'Backup & Recovery Manager',
    description: '1-Click full database JSON snapshot download, backup verification, and soft-deleted items recovery trash bin.',
    category: 'Backup',
    status: 'active',
    version: '1.6.0',
    enabled: true,
    addedDate: '2026-07-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'Safeguards content against accidental deletion with point-in-time recovery export.',
    tags: ['JSON Backup', 'Snapshot', 'Trash Recovery', 'Zero-Data-Loss'],
  },
  {
    id: 'media-manager',
    name: 'Media Manager & Digital Asset Library',
    description: 'Manage banners, PDF notes, thumbnail graphics, audio explanations, file size metrics, and duplicate media detection.',
    category: 'Media',
    status: 'active',
    version: '1.4.0',
    enabled: true,
    addedDate: '2026-07-15',
    lastUpdated: '2026-09-23',
    developerNotes: 'Integrated client-side image compression and secure cloud storage links.',
    tags: ['Storage CDN', 'Image Optimizer', 'PDF Repository', 'Asset Library'],
  },
  {
    id: 'notification-center',
    name: 'Notification Center & Push Broadcaster',
    description: 'Broadcast instant or scheduled in-app announcements, target Pro/Free tiers or individual students, and review send history.',
    category: 'Notifications',
    status: 'active',
    version: '2.1.0',
    enabled: true,
    addedDate: '2026-08-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'Supports rich deep-link tags to directly open test series or chapter notes.',
    tags: ['Push Alerts', 'Audience Targeting', 'Deep Links', 'Scheduler'],
  },
  {
    id: 'home-page-control',
    name: 'Home Page Control & Section Arranger',
    description: 'Visual layout builder to re-order user app homepage carousels, featured courses, recent tests, and announcement banners.',
    category: 'Home',
    status: 'active',
    version: '1.8.0',
    enabled: true,
    addedDate: '2026-08-15',
    lastUpdated: '2026-09-23',
    developerNotes: 'Realtime JSON schema sync with user companion emulator.',
    tags: ['Home Builder', 'Section Order', 'Featured Cards', 'Layout Sync'],
  },
  {
    id: 'feature-flags',
    name: 'Feature Flags & Runtime Kill Switches',
    description: 'Instantly toggle features ON/OFF (AI Tutor, Mock Tests, Downloads, Payment Gateway) without rebuilding or re-uploading the APK.',
    category: 'Flags',
    status: 'active',
    version: '2.0.0',
    enabled: true,
    addedDate: '2026-09-01',
    lastUpdated: '2026-09-23',
    developerNotes: 'Zero-downtime feature rollout and emergency kill switch protection.',
    tags: ['Feature Flags', 'Zero Downtime', 'Kill Switch', 'Dynamic Config'],
  },
  {
    id: 'maintenance-controls',
    name: 'Maintenance Controls & Scheduled Lockout',
    description: 'Granular maintenance mode with countdown timers, custom multilingual notices, and service-specific maintenance states.',
    category: 'Maintenance',
    status: 'active',
    version: '1.9.0',
    enabled: true,
    addedDate: '2026-09-10',
    lastUpdated: '2026-09-23',
    developerNotes: 'Safely blocks write queries during critical database schema migration or upgrades.',
    tags: ['Emergency Lock', 'Multilingual Notice', 'Scheduled Maintenance'],
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools & Diagnostic Suite',
    description: 'API connection tester, Firebase Firestore benchmark tester, Storage ping, Cache flusher, and Configuration schema inspector.',
    category: 'Tools',
    status: 'active',
    version: '2.5.0',
    enabled: true,
    addedDate: '2026-09-20',
    lastUpdated: '2026-09-23',
    developerNotes: 'Real-time interactive diagnostic sandbox for developer health verification.',
    tags: ['API Benchmark', 'DB Ping', 'Cache Flush', 'Schema Inspector'],
  },
];

// ============================================================================
// 2. AUDIT LOG INITIAL SEED / LOCAL STORAGE
// ============================================================================
const AUDIT_STORAGE_KEY = 'eduveda_admin_audit_logs';
const ERROR_STORAGE_KEY = 'eduveda_admin_system_errors';
const ROLES_STORAGE_KEY = 'eduveda_admin_custom_roles';
const PROMPTS_STORAGE_KEY = 'eduveda_admin_prompt_templates';
const NOTIFICATIONS_STORAGE_KEY = 'eduveda_admin_notifications';
const REGISTRY_STORAGE_KEY = 'eduveda_developer_feature_registry';

// ============================================================================
// 3. AUDIT LOGGING HELPER
// ============================================================================
export const logAdminAction = async (
  actorEmail: string,
  actorName: string,
  actorRole: string,
  action: string,
  feature: string,
  oldValue?: string,
  newValue?: string,
  status: 'success' | 'warning' | 'error' = 'success'
): Promise<AuditLogEntry> => {
  const newEntry: AuditLogEntry = {
    id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    actorEmail: actorEmail || 'developer@eduveda.in',
    actorName: actorName || 'Lead Developer',
    actorRole: actorRole || 'developer',
    action,
    feature,
    oldValue: oldValue || '',
    newValue: newValue || '',
    timestamp: new Date().toISOString(),
    deviceInfo: navigator.userAgent.includes('Mobile') ? 'Mobile Web App' : 'Desktop Admin Console',
    status,
  };

  try {
    // 1. Try writing to Firestore audit_logs collection
    await setDoc(doc(db, 'audit_logs', newEntry.id), newEntry);
  } catch (err) {
    // Fallback to localStorage
    console.warn('Firestore audit log notice, persisting to local audit store:', err);
  }

  // Also update local cache
  try {
    const existing = getStoredAuditLogs();
    const updated = [newEntry, ...existing].slice(0, 100);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage quota
  }

  return newEntry;
};

export const getStoredAuditLogs = (): AuditLogEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }

  // Seed default initial logs
  return [
    {
      id: 'audit_init_1',
      actorEmail: 'developer@eduveda.in',
      actorName: 'Lead Master Developer',
      actorRole: 'developer',
      action: 'Initialized Developer Access & Central Feature Registry',
      feature: 'Developer Access Hub',
      oldValue: 'v2.3.0',
      newValue: 'v2.5.0 Master',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      deviceInfo: 'Desktop Admin Console (Linux x86_64)',
      status: 'success',
    },
    {
      id: 'audit_init_2',
      actorEmail: 'developer@eduveda.in',
      actorName: 'Lead Master Developer',
      actorRole: 'developer',
      action: 'Configured Multi-Provider Failover Matrix (Groq + Gemini + OpenRouter)',
      feature: 'AI Control Center',
      oldValue: 'Single Gemini Provider',
      newValue: 'Tri-Provider Auto Failover Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      deviceInfo: 'Desktop Admin Console',
      status: 'success',
    },
    {
      id: 'audit_init_3',
      actorEmail: 'admin@eduveda.in',
      actorName: 'Academic Content Manager',
      actorRole: 'content_admin',
      action: 'Published UPSC 2026 Foundation Mock Series Test 1',
      feature: 'Mock Tests Bank',
      oldValue: 'Draft',
      newValue: 'Published Live',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      deviceInfo: 'Desktop Chrome 124.0',
      status: 'success',
    },
  ];
};

// ============================================================================
// 4. SYSTEM ERROR LOGS HELPER
// ============================================================================
export const getStoredSystemErrors = (): SystemErrorLog[] => {
  try {
    const raw = localStorage.getItem(ERROR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }

  return [
    {
      id: 'err_101',
      category: 'ai',
      message: 'Groq Rate Limit Threshold approached (85% TPM consumed)',
      details: 'Auto-failover router prepared fallback to Gemini 2.5 Flash without user disruption.',
      statusCode: 429,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'resolved',
      severity: 'warning',
      resolvedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      resolvedBy: 'Auto Failover Guard',
    },
    {
      id: 'err_102',
      category: 'database',
      message: 'Firestore Index Verification Notice on mcq_attempts',
      details: 'Compound query on userId + createdAt optimized with composite indexing.',
      statusCode: 'INDEX_REQUIRED',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      status: 'resolved',
      severity: 'info',
      resolvedAt: new Date(Date.now() - 1000 * 60 * 170).toISOString(),
      resolvedBy: 'Lead Developer',
    },
    {
      id: 'err_103',
      category: 'network',
      message: 'Student client transient timeout on 2G connection (Video Stream #14)',
      details: 'HLS adaptive player stepped down from 1080p to 360p smoothly.',
      statusCode: 'NET_TIMEOUT',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      status: 'open',
      severity: 'info',
    },
  ];
};

export const saveSystemErrors = (errors: SystemErrorLog[]) => {
  try {
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  } catch (e) {
    // Ignore
  }
};

// ============================================================================
// 5. ROLE & PERMISSIONS DEFAULT ROLES
// ============================================================================
export const DEFAULT_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'role_developer',
    name: 'Lead System Developer',
    description: 'Master access to Developer Access, Code Injector, DB Sync, AI Prompts, and System Settings.',
    isSystem: true,
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      publish: true,
      ai_permission: true,
      developer_access: true,
    },
    assignedUsersCount: 2,
    createdAt: '2026-01-01',
  },
  {
    id: 'role_content_admin',
    name: 'Academic Content Manager',
    description: 'Manage and publish subjects, video lectures, notes, MCQs, and mock test exams.',
    isSystem: true,
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      publish: true,
      ai_permission: true,
      developer_access: false,
    },
    assignedUsersCount: 4,
    createdAt: '2026-01-01',
  },
  {
    id: 'role_prompt_engineer',
    name: 'AI Prompt & Curriculum Specialist',
    description: 'Design and test AI prompts, MCQ generators, doubt explanations, and review AI responses.',
    isSystem: false,
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      publish: false,
      ai_permission: true,
      developer_access: true,
    },
    assignedUsersCount: 1,
    createdAt: '2026-03-10',
  },
  {
    id: 'role_moderator',
    name: 'Student Community Moderator',
    description: 'Review student doubt questions, check mock leaderboard submissions, and report violations.',
    isSystem: false,
    permissions: {
      view: true,
      create: false,
      edit: true,
      delete: false,
      publish: false,
      ai_permission: false,
      developer_access: false,
    },
    assignedUsersCount: 3,
    createdAt: '2026-04-01',
  },
];

export const getStoredRoles = (): CustomRole[] => {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return DEFAULT_CUSTOM_ROLES;
};

export const saveStoredRoles = (roles: CustomRole[]) => {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch (e) {
    // Ignore
  }
};

// ============================================================================
// 6. PROMPT TEMPLATES STORE WITH VERSION HISTORY
// ============================================================================
export interface PromptTemplateItem {
  id: string;
  name: string;
  category: 'mcq' | 'notes' | 'explanation' | 'mock' | 'doubt' | 'summary' | 'translation' | 'system';
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  currentVersion: string;
  versions: Array<{
    version: string;
    systemPrompt: string;
    userPromptTemplate: string;
    updatedAt: string;
    updatedBy: string;
    notes: string;
  }>;
}

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplateItem[] = [
  {
    id: 'prompt_mcq_gen',
    name: 'MCQ & Quiz Generator Prompt',
    category: 'mcq',
    description: 'Generates syllabus-aligned multiple choice questions with 4 options and Hindi/English step explanations.',
    systemPrompt: `You are an expert exam question creator for competitive exams (UPSC, State PSC, SSC, Banking).
Generate high-yield MCQs with exactly 4 options. Ensure one unambiguously correct answer.
Provide a crystal clear explanation in simple bilingual (Hindi + English) explaining WHY the correct option is right and other options are incorrect.
Output strictly in valid JSON format.`,
    userPromptTemplate: `Generate {count} MCQs on the topic: "{topic}" under Subject: "{subject}".
Difficulty level: {difficulty}.
Include previous year exam references (PYQ) where appropriate.`,
    currentVersion: 'v2.2',
    versions: [
      {
        version: 'v2.2',
        systemPrompt: `You are an expert exam question creator for competitive exams (UPSC, State PSC, SSC, Banking).
Generate high-yield MCQs with exactly 4 options. Ensure one unambiguously correct answer.
Provide a crystal clear explanation in simple bilingual (Hindi + English) explaining WHY the correct option is right and other options are incorrect.
Output strictly in valid JSON format.`,
        userPromptTemplate: `Generate {count} MCQs on the topic: "{topic}" under Subject: "{subject}".
Difficulty level: {difficulty}.
Include previous year exam references (PYQ) where appropriate.`,
        updatedAt: '2026-09-20T10:00:00Z',
        updatedBy: 'Lead Developer',
        notes: 'Added bilingual explanation constraint and strict JSON schema output format.',
      },
      {
        version: 'v2.1',
        systemPrompt: 'You are an educational MCQ creator. Make questions with 4 options.',
        userPromptTemplate: 'Generate MCQs for topic {topic}.',
        updatedAt: '2026-08-15T12:00:00Z',
        updatedBy: 'Lead Developer',
        notes: 'Initial standard MCQ generator prompt.',
      },
    ],
  },
  {
    id: 'prompt_doubt_solver',
    name: 'AI 24/7 Doubt Tutor Prompt',
    category: 'doubt',
    description: 'Instant student doubt solver providing empathetic, step-by-step guidance in friendly Hindi/Hinglish.',
    systemPrompt: `You are "Veda AI Guru", a friendly, patient, and highly knowledgeable Indian exam mentor.
Explain concepts step-by-step in clear, motivating Hindi/English (Hinglish).
Break down complex formulas into easy everyday analogies.
Always encourage the student with positive words.`,
    userPromptTemplate: `Student Doubt Query: "{question}"
Topic Context: "{topic}"
Please provide a structured, encouraging step-by-step explanation.`,
    currentVersion: 'v2.4',
    versions: [
      {
        version: 'v2.4',
        systemPrompt: `You are "Veda AI Guru", a friendly, patient, and highly knowledgeable Indian exam mentor.
Explain concepts step-by-step in clear, motivating Hindi/English (Hinglish).
Break down complex formulas into easy everyday analogies.
Always encourage the student with positive words.`,
        userPromptTemplate: `Student Doubt Query: "{question}"
Topic Context: "{topic}"
Please provide a structured, encouraging step-by-step explanation.`,
        updatedAt: '2026-09-22T14:30:00Z',
        updatedBy: 'Lead Developer',
        notes: 'Enhanced conversational tone and formula breakdown rules.',
      },
    ],
  },
  {
    id: 'prompt_notes_summary',
    name: 'Chapter Notes & Quick Revision Summary',
    category: 'notes',
    description: 'Condenses full lecture transcripts and textbook chapters into bulleted mindmaps and key points for fast revision.',
    systemPrompt: `You are a master study notes compiler. Extract key definitions, historical dates, constitutional articles, scientific principles, and mnemonics.
Format using clean Markdown headers, bullet points, and highlight tables.`,
    userPromptTemplate: `Please summarize and extract high-yield revision notes from the following text on "{topic}":
\n\n{text}`,
    currentVersion: 'v1.9',
    versions: [
      {
        version: 'v1.9',
        systemPrompt: 'You are a master study notes compiler.',
        userPromptTemplate: 'Summarize notes on {topic}:\n{text}',
        updatedAt: '2026-09-18T09:00:00Z',
        updatedBy: 'Content Admin',
        notes: 'Added mnemonics and table formatting.',
      },
    ],
  },
  {
    id: 'prompt_mock_generator',
    name: 'Mock Test Blueprint & Question Assembler',
    category: 'mock',
    description: 'Generates full-length simulated mock exam papers with section-wise distribution, negative marking rules, and time constraints.',
    systemPrompt: `You are the Chief Examination Controller for UPSC Prelims / State PSC.
Design a balanced exam paper covering Easy (30%), Medium (50%), and Hard (20%) questions.
Ensure high analytical quality, statement-based questions ("Which of the statements given above is/are correct?").`,
    userPromptTemplate: `Generate a Mock Test blueprint with {count} questions for "{examName}".
Sections: {sections}.`,
    currentVersion: 'v2.0',
    versions: [
      {
        version: 'v2.0',
        systemPrompt: 'You are Chief Examination Controller for UPSC Prelims / State PSC.',
        userPromptTemplate: 'Generate Mock Test blueprint with {count} questions for "{examName}".',
        updatedAt: '2026-09-15T11:00:00Z',
        updatedBy: 'Lead Developer',
        notes: 'Added statement-based UPSC style question formatting.',
      },
    ],
  },
];

export const getStoredPromptTemplates = (): PromptTemplateItem[] => {
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return DEFAULT_PROMPT_TEMPLATES;
};

export const saveStoredPromptTemplates = (prompts: PromptTemplateItem[]) => {
  try {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
  } catch (e) {
    // Ignore
  }
};

// ============================================================================
// 7. NOTIFICATIONS STORE
// ============================================================================
export const getStoredNotifications = (): NotificationBroadcast[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }

  return [
    {
      id: 'notif_1',
      title: '🎯 All India Live Mock Test Series Active!',
      body: 'Full syllabus Mock Test #4 is now live. Attempt before Sunday 9 PM to get your All India Rank.',
      type: 'mock_test',
      targetAudience: 'all',
      actionUrl: 'tab:mocktests',
      status: 'sent',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      createdByName: 'Lead Developer',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 'notif_2',
      title: '📚 New PDF Chapter Notes Added: Indian Polity',
      body: 'Comprehensive handwritten revision notes on Constitutional Framework & Fundamental Rights now available in Notes section.',
      type: 'new_content',
      targetAudience: 'all',
      actionUrl: 'tab:notes',
      status: 'sent',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      createdByName: 'Academic Content Manager',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    },
  ];
};

export const saveStoredNotifications = (notifs: NotificationBroadcast[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    // Ignore
  }
};

// ============================================================================
// 8. FEATURE REGISTRY STORE HELPER
// ============================================================================
export const getStoredFeatureRegistry = (): FeatureRegistryItem[] => {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed: FeatureRegistryItem[] = JSON.parse(raw);
      // Merge in any missing defaults so new features are never lost
      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = DEFAULT_FEATURE_REGISTRY.filter((d) => !existingIds.has(d.id));
      return [...parsed, ...missing];
    }
  } catch (e) {
    // Ignore
  }
  return DEFAULT_FEATURE_REGISTRY;
};

export const saveStoredFeatureRegistry = (registry: FeatureRegistryItem[]) => {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    // Ignore
  }
};

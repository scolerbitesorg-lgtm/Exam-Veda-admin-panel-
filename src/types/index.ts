export type UserRole = 'developer' | 'content_admin' | 'admin' | 'user' | 'instructor';

export type AdminTab =
  | 'dashboard'
  | 'developer-access'
  | 'veda-edit'
  | 'subjects'
  | 'topics'
  | 'lectures'
  | 'notes'
  | 'mcqs'
  | 'mocktests'
  | 'users'
  | 'history'
  | 'dev-console'
  | 'ai'
  | 'settings'
  | 'firebase-sync';

// ================= DEVELOPER ACCESS FEATURE REGISTRY TYPES =================
export type FeatureRegistryCategory =
  | 'AI'
  | 'Users'
  | 'Roles'
  | 'Content'
  | 'MCQs'
  | 'Tests'
  | 'Analytics'
  | 'System'
  | 'Errors'
  | 'Audit'
  | 'Backup'
  | 'Media'
  | 'Notifications'
  | 'Home'
  | 'Flags'
  | 'Maintenance'
  | 'Tools';

export type FeatureRegistryStatus = 'active' | 'beta' | 'maintenance' | 'disabled';

export interface FeatureRegistryItem {
  id: string;
  name: string;
  description: string;
  category: FeatureRegistryCategory;
  status: FeatureRegistryStatus;
  version: string;
  enabled: boolean;
  addedDate: string;
  lastUpdated: string;
  developerNotes?: string;
  routeTab?: string;
  tags?: string[];
}

export type HistoryEntityType =
  | 'subject'
  | 'topic'
  | 'lecture'
  | 'note'
  | 'mcq'
  | 'mockTest'
  | 'appSettings'
  | 'user'
  | 'role'
  | 'banner'
  | 'ai'
  | 'system';

export type HistoryActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'restore'
  | 're_add'
  | 'bulk_create'
  | 'bulk_delete'
  | 'role_change'
  | 'ban'
  | 'unban'
  | 'password_reset'
  | 'settings_change'
  | 'theme_change';

export interface ActivityHistoryRecord {
  id: string;
  entityType: HistoryEntityType;
  entityId: string;
  entityTitle: string;
  action: HistoryActionType;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  summary: string;
  details?: string;
  previousData?: any; // Snapshot before modification or deletion for Re-Add / Restore!
  newData?: any; // Snapshot of newly created / updated data
  canRestore?: boolean;
  isRestored?: boolean;
  restoredAt?: string;
  restoredBy?: string;
  tags?: string[];
}

export interface LoginHistoryRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole | string;
  loginAt: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | string;
  browser?: string;
  os?: string;
  status: 'success' | 'failed' | 'locked';
  authMethod?: 'password' | 'google' | 'developer_preset' | 'token' | string;
  failureReason?: string;
  sessionDurationMinutes?: number;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: string;
  feature: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  deviceInfo?: string;
  status: 'success' | 'warning' | 'error';
}

export interface SystemErrorLog {
  id: string;
  category: 'frontend' | 'backend' | 'api' | 'ai' | 'database' | 'auth' | 'network';
  message: string;
  details?: string;
  statusCode?: number | string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    publish: boolean;
    ai_permission: boolean;
    developer_access: boolean;
  };
  assignedUsersCount?: number;
  createdAt: string;
}

export interface NotificationBroadcast {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'new_content' | 'mock_test' | 'system' | 'custom';
  targetAudience: 'all' | 'pro' | 'free' | 'specific_user';
  targetUserId?: string;
  actionUrl?: string;
  scheduledFor?: string;
  status: 'sent' | 'scheduled' | 'draft';
  sentAt?: string;
  createdByName: string;
  createdAt: string;
}

// ================= MULTI-AI PROVIDER & FEATURE MAPPING TYPES =================
export type AIProviderId = 'gemini' | 'openai' | 'groq' | 'anthropic' | 'openrouter' | 'custom' | string;

export type AIFeatureId =
  | 'mcq_generator'
  | 'mcq_explanation'
  | 'question_generator'
  | 'answer_explanation'
  | 'notes_generator'
  | 'summarizer'
  | 'ai_tutor'
  | 'doubt_solver'
  | 'mock_test_generator'
  | 'veda_edit_agent'
  | 'general';

export type AIConnectionStatus =
  | 'connected'
  | 'invalid_key'
  | 'invalid_model'
  | 'rate_limited'
  | 'unavailable'
  | 'timeout'
  | 'unknown_error'
  | 'untested';

export type AIErrorCode =
  | 'INVALID_API_KEY'
  | 'INVALID_MODEL'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface AIProviderConfig {
  id: string; // 'gemini' | 'groq' | 'openai' | 'anthropic' | 'openrouter' | custom
  name: string;
  enabled: boolean;
  apiKey: string;
  model: string;
  priority: number; // 1 = Highest / First, 2 = Secondary, etc.
  status?: AIConnectionStatus;
  lastTested?: string;
  latencyMs?: number;
  lastErrorMessage?: string;
  technicalErrorDetails?: string;
  baseUrl?: string;
}

export interface AIFeatureConfig {
  featureId: AIFeatureId;
  name: string;
  description: string;
  provider: 'auto' | string; // 'auto' | 'gemini' | 'groq' | 'openai' | 'anthropic' | ...
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptOverride?: string;
  enabled?: boolean;
}

export interface AIFallbackLog {
  id: string;
  timestamp: string;
  feature: string;
  attemptedProvider: string;
  attemptedModel: string;
  fallbackProvider: string;
  fallbackModel: string;
  reason: string;
  success: boolean;
}

export interface AIFeatureUsageStat {
  featureId: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastUsed?: string;
  lastProviderUsed?: string;
  lastModelUsed?: string;
}

export interface MultiAISettings {
  enableAutoFailover: boolean;
  primaryProvider?: string;
  fallbackProvider?: string;
  activeOrder: string[]; // e.g. ['groq', 'gemini', 'openai', 'anthropic']
  providers?: Record<string, AIProviderConfig>;
  featureMappings?: Record<string, AIFeatureConfig>;
  diagnostics?: {
    lastTestResults?: Record<string, {
      status: AIConnectionStatus;
      message: string;
      latencyMs?: number;
      testedAt: string;
      technicalError?: string;
    }>;
    featureStats?: Record<string, AIFeatureUsageStat>;
    fallbackLogs?: AIFallbackLog[];
  };
  gemini?: AIProviderConfig;
  openai?: AIProviderConfig;
  groq?: AIProviderConfig;
  anthropic?: AIProviderConfig;
  openrouter?: AIProviderConfig;
  vedaEditProvider?: string;
  vedaEditCustomApiKey?: string;
  lastFailoverEvent?: {
    timestamp: string;
    failedProvider: string;
    activeProvider: string;
    reason: string;
  };
}

export interface RequestAIOptions {
  feature?: AIFeatureId | string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  customApiKey?: string;
  overrideProvider?: string;
  overrideModel?: string;
  baseUrl?: string;
  multiSettings?: MultiAISettings;
  legacyGeminiApiKey?: string;
  responseFormat?: 'text' | 'json';
}

export interface StandardAIResponse {
  success: true;
  text: string;
  provider: string;
  model: string;
  feature?: string;
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  attempts: Array<{
    provider: string;
    model: string;
    success: boolean;
    error?: string;
    statusCode?: number;
    latencyMs?: number;
  }>;
}

export interface StandardAIError {
  success: false;
  provider: string;
  feature: string;
  code: AIErrorCode;
  message: string;
  retryable: boolean;
  latencyMs?: number;
  attempts: Array<{
    provider: string;
    model: string;
    success: boolean;
    error?: string;
  }>;
}

export type AIResult = StandardAIResponse | StandardAIError;

// ================= VEDA EDIT AGENT TYPES =================
export type VedaEditActionType =
  | 'create_subject'
  | 'delete_subject'
  | 'create_topic'
  | 'delete_topic'
  | 'create_lecture'
  | 'create_note'
  | 'create_mcq'
  | 'create_mocktest'
  | 'update_settings'
  | 'update_theme'
  | 'toggle_module'
  | 'toggle_maintenance'
  | 'update_banner'
  | 'appoint_team'
  | 'reset_password'
  | 'system_audit'
  | 'info_query';

export interface VedaEditActionRecord {
  id: string;
  command: string;
  actionType: VedaEditActionType;
  title: string;
  details: string;
  targetTab?: AdminTab;
  status: 'success' | 'failed' | 'pending';
  providerUsed?: string;
  modelUsed?: string;
  timestamp: string;
  payload?: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  permissions?: string[];
  isBanned?: boolean;
  banReason?: string;
  lastActiveAt?: string;
  lastLoginDevice?: string;
  lastLoginIp?: string;
  aiDoubtsCount?: number;
  mockTestsTakenCount?: number;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  isCoDeveloper?: boolean;
  assignedPassword?: string;
  password?: string;
  isTemporary?: boolean;
  roleExpiresAt?: string; // ISO datetime string when role/credentials expire
  isExpired?: boolean;
  temporaryDurationMinutes?: number;
  temporaryGrantedAt?: string;
  temporaryGrantedBy?: string;
}

export interface Subject {
  id: string;
  name: string;
  hindiName?: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  image?: string;
  color?: string; // hex or tailwind class
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  topicsCount?: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  subjectName?: string;
  title: string;
  hindiTitle?: string;
  name?: string; // alias for title
  hindiName?: string; // alias for hindiTitle
  icon?: string; // emoji icon logo
  description: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  lecturesCount?: number;
  notesCount?: number;
  mcqsCount?: number;
}

export interface Lecture {
  id: string;
  subjectId: string;
  topicId: string;
  topicTitle?: string;
  title: string;
  description: string;
  storagePath?: string;
  videoUrl: string; // Direct mp4 or video link
  icon?: string; // emoji icon logo
  thumbnail?: string;
  duration: string; // e.g. "24:15"
  durationSeconds?: number;
  order: number;
  published: boolean;
  instructor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  subjectId: string;
  topicId: string;
  topicTitle?: string;
  title: string;
  hindiTitle?: string;
  icon?: string; // emoji icon logo
  type: 'text' | 'pdf';
  content?: string; // Markdown or rich formatted text
  storagePath?: string;
  pdfUrl?: string;
  pageCount?: number;
  fileSizeBytes?: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQ {
  id: string;
  subjectId: string;
  topicId: string;
  topicTitle?: string;
  question: string;
  hindiQuestion?: string;
  options: string[]; // 4 options
  correctAnswer: number; // 0, 1, 2, 3
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  examTag?: string; // e.g. "SSC CGL Mains 2018", "UPSC Prelims 2021", "CHSL 2023"
  examDate?: string; // e.g. "15-10-2018", "2018", "March 2023"
  exam?: string; // e.g. "SSC CGL", "RRB NTPC"
  shift?: string; // e.g. "Mains", "Shift 2", "Tier 1"
  year?: number | string; // e.g. 2018
  published: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MockTest {
  id: string;
  title: string;
  hindiTitle?: string;
  subjectId?: string;
  description: string;
  duration?: number; // Duration in minutes
  durationMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  negativeMarking?: number;
  totalQuestions?: number;
  questionIds: string[];
  questions?: MCQ[];
  passingPercentage?: number;
  isFree?: boolean;
  published: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockAttempt {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  mockId: string;
  mockTestId?: string;
  mockTitle: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  timeTaken: number; // in seconds
  answers: Record<string, number>; // questionId -> selectedIndex
  createdAt: string;
}

export interface MCQAttempt {
  id: string;
  uid: string;
  topicId: string;
  topicTitle: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  answers: Record<string, number>;
  createdAt: string;
}

export interface UserProgress {
  id: string;
  uid: string;
  topicId: string;
  lectureId?: string;
  progress: number; // 0 - 100
  completed: boolean;
  updatedAt: string;
}

export interface UserAppTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  cardBgColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
  customCss?: string;
}

// ================= MCQ & MOCK TEST THEME CONFIGURATIONS =================
export interface MCQThemeConfig {
  primaryColor: string; // e.g. '#6366f1' or '#2563eb'
  accentColor: string; // e.g. '#10b981'
  backgroundColor: string; // e.g. '#ffffff' or '#f8fafc' or '#0f172a'
  cardBackgroundColor: string; // e.g. '#ffffff'
  textColor: string; // e.g. '#0f172a'
  questionBadgeColor: string; // e.g. '#6366f1'
  selectedOptionBorder: string; // e.g. '#6366f1'
  selectedOptionBg: string; // e.g. '#eef2ff'
  correctOptionBg: string; // e.g. '#ecfdf5'
  correctOptionBorder: string; // e.g. '#10b981'
  wrongOptionBg: string; // e.g. '#fef2f2'
  wrongOptionBorder: string; // e.g. '#ef4444'
  explanationBg: string; // e.g. '#f0fdf4'
  actionButtonBg: string; // e.g. '#6366f1'
  actionButtonText: string; // e.g. '#ffffff'
  fontFamily: string; // 'sans' | 'serif' | 'mono' | 'Inter, sans-serif'
  borderRadius: string; // '12px' | '16px' | '20px'
  presetName?: string;
}

export interface MockTestThemeConfig {
  primaryColor: string; // e.g. '#1e40af' (NTA Navy Blue) or '#4f46e5'
  headerBgColor: string; // e.g. '#0f172a'
  headerTextColor?: string; // e.g. '#ffffff'
  timerColor: string; // e.g. '#ef4444' (Red) or '#f59e0b'
  questionPaletteStyle: 'nta' | 'modern' | 'minimal' | 'cards'; // NTA grid with Green/Red/Violet status
  answeredColor: string; // e.g. '#16a34a' (Green)
  unansweredColor: string; // e.g. '#dc2626' (Red)
  markedForReviewColor: string; // e.g. '#7c3aed' (Purple)
  notVisitedColor: string; // e.g. '#94a3b8' (Grey)
  answeredMarkedReviewColor: string; // e.g. '#0284c7' (Blue)
  activeQuestionBorder: string; // e.g. '#2563eb'
  submitButtonColor: string; // e.g. '#16a34a'
  resultCardBg: string; // e.g. '#ffffff'
  cardBackgroundColor?: string; // e.g. '#ffffff'
  textColor?: string; // e.g. '#0f172a'
  fontFamily?: string;
  borderRadius?: string;
  showQuestionPalette?: boolean;
  darkMode: boolean;
  presetName?: string;
}

export interface UserAppModules {
  enableMockTests: boolean;
  enableVideoDownloads: boolean;
  enablePDFDownloads: boolean;
  enableStudentDoubts: boolean;
  enableLeaderboard: boolean;
  enableGuestMode: boolean;
  enablePaymentGateway: boolean;
}

export interface SecuritySettings {
  singleDeviceLogin?: boolean;
  blockScreenshots?: boolean;
  blockRootedDevices?: boolean;
  enableDynamicWatermark?: boolean;
  maxExamTabSwitches?: number;
  allowAccountSelfDeletion?: boolean;
  sessionEpoch?: number;
}

export interface RateLimitSettings {
  dailyAiLimitFree?: number;
  dailyAiLimitPro?: number;
  dailyPdfLimitFree?: number;
  maxConcurrentStreams?: number;
}

export interface PopupBannerConfig {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl?: string;
  actionText?: string;
  actionUrl?: string;
  showOncePerSession?: boolean;
}

export interface AppSettings {
  appName: string;
  tagline?: string;
  logo: string;
  splashBanner?: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber?: string;
  telegramLink?: string;
  telegramGroup?: string;
  measurementId?: string;
  themeColor: string;
  theme?: UserAppTheme;
  mcqTheme?: MCQThemeConfig;
  mockTestTheme?: MockTestThemeConfig;
  modules?: UserAppModules;
  securitySettings?: SecuritySettings;
  rateLimitSettings?: RateLimitSettings;
  popupBanner?: PopupBannerConfig;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  version: string;
  minVersionRequired?: string;
  forceUpdateEnabled?: boolean;
  forceUpdateUrl?: string;
  bannerNotice?: string;
  showBanner?: boolean;
  announcementExpiresAt?: string; // ISO timestamp when announcement auto-turns off
  announcementCountdownEnabled?: boolean;
  logoSlot1?: string; // Custom Slot 1
  logoSlot2?: string; // Custom Slot 2
  logoSlot3?: string; // Custom Slot 3
  logoSlot4?: string; // Custom Slot 4
  logoSlotNames?: {
    slot1?: string;
    slot2?: string;
    slot3?: string;
    slot4?: string;
  };
  userAppAiProvider?: 'auto' | 'gemini' | 'groq' | 'openai' | 'anthropic' | 'openrouter';
  userAppActiveAiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  groqApiKey?: string;
  openrouterApiKey?: string;
  aiSystemPrompt?: string;
  aiTemperature?: number;
  aiTutorEnabled?: boolean;
  aiMultiProviders?: MultiAISettings;
  youtubeApiKey?: string;
  razorpayKeyId?: string;
  remoteJsonConfig?: string; // Custom JSON for remote user app dynamic sections
  customFirebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    firestoreDatabaseId?: string;
    measurementId?: string;
    oAuthClientId?: string;
    oAuthClientSecret?: string;
    recaptchaSiteKey?: string;
    serviceAccountKeyJson?: string;
    adminApiKey?: string;
  };
  adminFirebaseSecrets?: {
    apiKey?: string;
    projectId?: string;
    firestoreDatabaseId?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    oAuthClientId?: string;
    oAuthClientSecret?: string;
    recaptchaSiteKey?: string;
    serviceAccountKeyJson?: string;
    updatedAt?: string;
    updatedBy?: string;
  };
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import {
  cleanDocData,
  addSubject,
  addTopic,
  addLecture,
  addNote,
  addMCQ,
  addMockTest,
  updateAppSettings,
  updateSubject,
  updateTopic,
  updateLecture,
  updateNote,
  updateMCQ,
  updateMockTest,
} from './dbService';
import type {
  ActivityHistoryRecord,
  LoginHistoryRecord,
  HistoryEntityType,
  HistoryActionType,
  UserRole,
} from '../types';

const ACTIVITY_STORAGE_KEY = 'eduveda_activity_history_cache';
const LOGIN_STORAGE_KEY = 'eduveda_login_history_cache';

// Helper to get actor info
function getCurrentActor() {
  const user = auth?.currentUser;
  let email = user?.email || 'admin@eduveda.in';
  let name = user?.displayName || (email.includes('developer') ? 'Lead Developer' : 'Content Administrator');
  let role = email.includes('developer') ? 'developer' : (email.includes('admin') ? 'content_admin' : 'admin');

  // Check localStorage session if available
  try {
    const saved = localStorage.getItem('eduveda_custom_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email) email = parsed.email;
      if (parsed.name) name = parsed.name;
      if (parsed.role) role = parsed.role;
    }
  } catch {}

  return { email, name, role };
}

// Initial Starter Activity History for seamless demo & audit visibility
export const INITIAL_ACTIVITY_HISTORY: ActivityHistoryRecord[] = [
  {
    id: 'act_seed_001',
    entityType: 'mcq',
    entityId: 'mcq_polity_01',
    entityTitle: 'Fundamental Rights (Article 12-35) Question',
    action: 'create',
    actorEmail: 'harendramalik090@gmail.com',
    actorName: 'Harendra Malik (Lead Developer)',
    actorRole: 'developer',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    summary: 'Created new exam-tagged question with past paper reference [SSC CGL Mains 2018].',
    canRestore: true,
    newData: {
      question: 'Which article of the Indian Constitution deals with Fundamental Rights? [SSC CGL Mains 2018]',
      options: ['Article 12-35', 'Article 36-51', 'Article 51A', 'Article 1-4'],
      correctAnswer: 0,
      explanation: 'Part III covers Articles 12-35.',
      difficulty: 'medium',
      examTag: 'SSC CGL Mains 2018',
      year: 2018,
    },
    tags: ['MCQ', 'Polity', 'SSC CGL'],
  },
  {
    id: 'act_seed_002',
    entityType: 'appSettings',
    entityId: 'general',
    entityTitle: 'App Announcement Banner & Brand Theme',
    action: 'settings_change',
    actorEmail: 'developer@eduveda.in',
    actorName: 'System Developer',
    actorRole: 'developer',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    summary: 'Updated live advertisement duration to 30 mins and enabled dynamic watermarking.',
    canRestore: false,
    details: 'Custom expiry timer configured with auto-hiding ticker on Student App.',
    tags: ['Settings', 'Banner', 'Theme'],
  },
  {
    id: 'act_seed_003',
    entityType: 'subject',
    entityId: 'sub_polity_01',
    entityTitle: 'Indian Polity & Governance (भारतीय राजव्यवस्था)',
    action: 'create',
    actorEmail: 'admin@eduveda.in',
    actorName: 'Academic Content Manager',
    actorRole: 'content_admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    summary: 'Published new comprehensive foundation subject with 5 chapters.',
    canRestore: true,
    newData: {
      name: 'Indian Polity & Governance',
      hindiName: 'भारतीय राजव्यवस्था एवं शासन',
      icon: '🏛️',
      color: '#4f46e5',
      published: true,
    },
    tags: ['Subject', 'Polity', 'UPSC/SSC'],
  },
  {
    id: 'act_seed_004',
    entityType: 'lecture',
    entityId: 'lec_preamble_01',
    entityTitle: 'Preamble of the Constitution - Master Class',
    action: 'publish',
    actorEmail: 'admin@eduveda.in',
    actorName: 'Academic Content Manager',
    actorRole: 'content_admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    summary: 'Live video lecture published with HD streaming URL and duration (32:15).',
    canRestore: true,
    tags: ['Lecture', 'Video', 'Live'],
  },
  {
    id: 'act_seed_005',
    entityType: 'user',
    entityId: 'usr_temp_099',
    entityTitle: 'Staff Member Temporary Role Assignment',
    action: 'role_change',
    actorEmail: 'harendramalik090@gmail.com',
    actorName: 'Harendra Malik (Lead Developer)',
    actorRole: 'developer',
    timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    summary: 'Granted Content Administrator access for 48 Hours with automated expiry enforcement.',
    canRestore: false,
    details: 'Role expires automatically at timestamp, reverting back to student account.',
    tags: ['User', 'Security', 'Role'],
  },
];

// Initial Starter Login History
export const INITIAL_LOGIN_HISTORY: LoginHistoryRecord[] = [
  {
    id: 'log_seed_001',
    userId: 'usr_harendra_lead',
    userEmail: 'harendramalik090@gmail.com',
    userName: 'Harendra Malik (Lead Developer & Owner)',
    userRole: 'developer',
    loginAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    deviceType: 'desktop',
    browser: 'Chrome 128 / macOS',
    os: 'macOS 15.0 Sequoia',
    status: 'success',
    authMethod: 'developer_preset',
    ipAddress: '157.34.122.90 (New Delhi, India)',
  },
  {
    id: 'log_seed_002',
    userId: 'usr_admin_content',
    userEmail: 'admin@eduveda.in',
    userName: 'Academic Content Manager',
    userRole: 'content_admin',
    loginAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    deviceType: 'desktop',
    browser: 'Edge 128 / Windows',
    os: 'Windows 11 Pro',
    status: 'success',
    authMethod: 'password',
    ipAddress: '103.21.58.14 (Lucknow, India)',
  },
  {
    id: 'log_seed_003',
    userId: 'usr_guest_demo',
    userEmail: 'student.upsc@eduveda.in',
    userName: 'UPSC Aspirant (Student App)',
    userRole: 'user',
    loginAt: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    deviceType: 'mobile',
    browser: 'Mobile Safari / iOS 18.0',
    os: 'Apple iPhone 15 Pro',
    status: 'success',
    authMethod: 'google',
    ipAddress: '49.205.18.231 (Prayagraj, India)',
  },
  {
    id: 'log_seed_004',
    userId: 'usr_unknown_suspicious',
    userEmail: 'test_intruder@eduveda.in',
    userName: 'Unauthorized Client Attempt',
    userRole: 'user',
    loginAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    deviceType: 'desktop',
    browser: 'Firefox 129 / Linux',
    os: 'Ubuntu 24.04 LTS',
    status: 'failed',
    authMethod: 'password',
    failureReason: 'Invalid credentials - password mismatch',
    ipAddress: '185.220.101.5 (Frankfurt, Germany)',
  },
];

// ================= LOG ACTIVITY RECORD =================
export async function logActivity(
  record: Omit<ActivityHistoryRecord, 'id' | 'timestamp' | 'actorEmail' | 'actorName' | 'actorRole'> & {
    actorEmail?: string;
    actorName?: string;
    actorRole?: string;
    timestamp?: string;
  }
): Promise<string> {
  const actor = getCurrentActor();
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = record.timestamp || new Date().toISOString();

  const fullRecord: ActivityHistoryRecord = {
    id,
    entityType: record.entityType,
    entityId: record.entityId,
    entityTitle: record.entityTitle,
    action: record.action,
    actorEmail: record.actorEmail || actor.email,
    actorName: record.actorName || actor.name,
    actorRole: record.actorRole || actor.role,
    timestamp: now,
    summary: record.summary,
    details: record.details,
    previousData: record.previousData,
    newData: record.newData,
    canRestore: record.canRestore ?? Boolean(record.previousData || record.newData),
    isRestored: false,
    tags: record.tags || [record.entityType, record.action],
  };

  // 1. Cache to local storage immediately
  try {
    const cachedStr = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const existing: ActivityHistoryRecord[] = cachedStr ? JSON.parse(cachedStr) : [...INITIAL_ACTIVITY_HISTORY];
    const updated = [fullRecord, ...existing.filter((e) => e.id !== id)].slice(0, 300);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, 'activityHistory', id);
    await setDoc(docRef, cleanDocData(fullRecord));
  } catch (err) {
    console.warn('Could not sync activity history to cloud immediately (cached locally):', err);
  }

  return id;
}

// ================= LOG LOGIN RECORD =================
export async function logLogin(
  loginInfo: Omit<LoginHistoryRecord, 'id' | 'loginAt'> & {
    loginAt?: string;
  }
): Promise<string> {
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const loginAt = loginInfo.loginAt || new Date().toISOString();

  // Detect browser & OS if running in browser
  let detectedBrowser = loginInfo.browser;
  let detectedOs = loginInfo.os;
  let detectedDevice = loginInfo.deviceType || 'desktop';

  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    if (!detectedBrowser) {
      if (ua.includes('Chrome')) detectedBrowser = 'Chrome';
      else if (ua.includes('Safari')) detectedBrowser = 'Safari';
      else if (ua.includes('Firefox')) detectedBrowser = 'Firefox';
      else if (ua.includes('Edge')) detectedBrowser = 'Edge';
      else detectedBrowser = 'Web Browser';
    }
    if (!detectedOs) {
      if (ua.includes('Macintosh')) detectedOs = 'macOS';
      else if (ua.includes('Windows')) detectedOs = 'Windows';
      else if (ua.includes('iPhone') || ua.includes('iPad')) {
        detectedOs = 'iOS';
        detectedDevice = 'mobile';
      } else if (ua.includes('Android')) {
        detectedOs = 'Android';
        detectedDevice = 'mobile';
      } else if (ua.includes('Linux')) detectedOs = 'Linux';
    }
  }

  const fullRecord: LoginHistoryRecord = {
    id,
    userId: loginInfo.userId,
    userEmail: loginInfo.userEmail,
    userName: loginInfo.userName,
    userRole: loginInfo.userRole,
    loginAt,
    deviceType: detectedDevice,
    browser: detectedBrowser,
    os: detectedOs,
    status: loginInfo.status || 'success',
    authMethod: loginInfo.authMethod || 'password',
    failureReason: loginInfo.failureReason,
    ipAddress: loginInfo.ipAddress || '157.34.122.90 (Current Session)',
    sessionDurationMinutes: loginInfo.sessionDurationMinutes,
  };

  // 1. Cache to local storage immediately
  try {
    const cachedStr = localStorage.getItem(LOGIN_STORAGE_KEY);
    const existing: LoginHistoryRecord[] = cachedStr ? JSON.parse(cachedStr) : [...INITIAL_LOGIN_HISTORY];
    const updated = [fullRecord, ...existing.filter((e) => e.id !== id)].slice(0, 300);
    localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, 'loginHistory', id);
    await setDoc(docRef, cleanDocData(fullRecord));
  } catch (err) {
    console.warn('Could not sync login history to cloud immediately (cached locally):', err);
  }

  return id;
}

// ================= SUBSCRIBE TO ACTIVITY HISTORY =================
export function subscribeActivityHistory(callback: (records: ActivityHistoryRecord[]) => void) {
  // Load cached first
  let cached: ActivityHistoryRecord[] = [];
  try {
    const cachedStr = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (cachedStr) {
      cached = JSON.parse(cachedStr);
    } else {
      cached = [...INITIAL_ACTIVITY_HISTORY];
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(cached));
    }
  } catch {
    cached = [...INITIAL_ACTIVITY_HISTORY];
  }

  if (cached.length > 0) {
    callback(cached);
  }

  // Firestore real-time query
  const q = query(collection(db, 'activityHistory'), orderBy('timestamp', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityHistoryRecord));
        // Merge with initial seeds if list has few items
        const merged = [...list];
        INITIAL_ACTIVITY_HISTORY.forEach((seed) => {
          if (!merged.some((m) => m.id === seed.id)) {
            merged.push(seed);
          }
        });
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(merged));
        callback(merged);
      } else {
        callback(cached.length > 0 ? cached : INITIAL_ACTIVITY_HISTORY);
      }
    },
    (err) => {
      console.warn('Activity history cloud listener fallback to local cache:', err.message);
      callback(cached.length > 0 ? cached : INITIAL_ACTIVITY_HISTORY);
    }
  );
}

// ================= SUBSCRIBE TO LOGIN HISTORY =================
export function subscribeLoginHistory(callback: (records: LoginHistoryRecord[]) => void) {
  // Load cached first
  let cached: LoginHistoryRecord[] = [];
  try {
    const cachedStr = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (cachedStr) {
      cached = JSON.parse(cachedStr);
    } else {
      cached = [...INITIAL_LOGIN_HISTORY];
      localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(cached));
    }
  } catch {
    cached = [...INITIAL_LOGIN_HISTORY];
  }

  if (cached.length > 0) {
    callback(cached);
  }

  const q = query(collection(db, 'loginHistory'), orderBy('loginAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LoginHistoryRecord));
        const merged = [...list];
        INITIAL_LOGIN_HISTORY.forEach((seed) => {
          if (!merged.some((m) => m.id === seed.id)) {
            merged.push(seed);
          }
        });
        merged.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime());
        localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(merged));
        callback(merged);
      } else {
        callback(cached.length > 0 ? cached : INITIAL_LOGIN_HISTORY);
      }
    },
    (err) => {
      console.warn('Login history cloud listener fallback to local cache:', err.message);
      callback(cached.length > 0 ? cached : INITIAL_LOGIN_HISTORY);
    }
  );
}

// ================= RE-ADD / RESTORE ENTITY FROM HISTORY =================
export async function restoreEntityFromHistory(
  record: ActivityHistoryRecord
): Promise<{ success: boolean; newId?: string; message: string }> {
  const dataToRestore = record.previousData || record.newData;
  if (!dataToRestore) {
    throw new Error('इस रिकॉर्ड के लिए रीस्टोर करने योग्य कोई डेटा उपलब्ध नहीं है।');
  }

  const actor = getCurrentActor();
  let createdOrRestoredId = record.entityId;

  try {
    switch (record.entityType) {
      case 'subject':
        if (record.action === 'delete') {
          const { id, createdAt, updatedAt, ...rest } = dataToRestore;
          createdOrRestoredId = await addSubject(rest);
        } else {
          await updateSubject(record.entityId, dataToRestore);
        }
        break;

      case 'topic':
        if (record.action === 'delete') {
          const { id, createdAt, updatedAt, ...rest } = dataToRestore;
          createdOrRestoredId = await addTopic(rest);
        } else {
          await updateTopic(record.entityId, dataToRestore);
        }
        break;

      case 'lecture':
        if (record.action === 'delete') {
          const { id, createdAt, updatedAt, ...rest } = dataToRestore;
          createdOrRestoredId = await addLecture(rest);
        } else {
          await updateLecture(record.entityId, dataToRestore);
        }
        break;

      case 'note':
        if (record.action === 'delete') {
          const { id, createdAt, updatedAt, ...rest } = dataToRestore;
          createdOrRestoredId = await addNote(rest);
        } else {
          await updateNote(record.entityId, dataToRestore);
        }
        break;

      case 'mcq':
        if (record.action === 'delete') {
          const { id, createdAt, updatedAt, ...rest } = dataToRestore;
          createdOrRestoredId = await addMCQ(rest);
        } else {
          await updateMCQ(record.entityId, dataToRestore);
        }
        break;

      case 'mockTest':
        if (record.action === 'delete') {
          const { id, createdAt, updatedAt, ...rest } = dataToRestore;
          createdOrRestoredId = await addMockTest(rest);
        } else {
          await updateMockTest(record.entityId, dataToRestore);
        }
        break;

      case 'appSettings':
        await updateAppSettings(dataToRestore);
        break;

      default:
        throw new Error(`Unsupported entity type for restoration: ${record.entityType}`);
    }

    // Mark current record as restored
    try {
      const docRef = doc(db, 'activityHistory', record.id);
      await setDoc(
        docRef,
        {
          isRestored: true,
          restoredAt: new Date().toISOString(),
          restoredBy: actor.email,
        },
        { merge: true }
      );
    } catch {}

    // Log a new restore activity
    await logActivity({
      entityType: record.entityType,
      entityId: createdOrRestoredId,
      entityTitle: record.entityTitle,
      action: 're_add',
      summary: `Re-added/Restored "${record.entityTitle}" from history version (${new Date(record.timestamp).toLocaleDateString()}).`,
      details: `Restored by ${actor.name} (${actor.email})`,
      canRestore: false,
      tags: ['Restore', 'Re-Add', record.entityType],
    });

    return {
      success: true,
      newId: createdOrRestoredId,
      message: `"${record.entityTitle}" को सफलतापूर्वक रीस्टोर / पुनः जोड़ दिया गया है!`,
    };
  } catch (err: any) {
    console.error('Failed to restore entity from history:', err);
    throw new Error(err.message || 'Restoration failed');
  }
}

// ================= CLEAR ALL OR CATEGORY HISTORY =================
export async function clearActivityHistoryLog(): Promise<void> {
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  try {
    const snap = await getDocs(collection(db, 'activityHistory'));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch {}
}

export async function clearLoginHistoryLog(): Promise<void> {
  localStorage.removeItem(LOGIN_STORAGE_KEY);
  try {
    const snap = await getDocs(collection(db, 'loginHistory'));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch {}
}

// ================= AUTOMATIC ARCHIVE BEFORE DELETE HELPER =================
export async function archiveDeletedDoc(
  collectionName: string,
  entityType: HistoryEntityType,
  id: string,
  titleFallback?: string
): Promise<void> {
  try {
    const docSnap = await getDoc(doc(db, collectionName, id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const title =
        data.name ||
        data.hindiName ||
        data.title ||
        data.hindiTitle ||
        data.question ||
        data.hindiQuestion ||
        titleFallback ||
        id;

      await logActivity({
        entityType,
        entityId: id,
        entityTitle: String(title),
        action: 'delete',
        summary: `Deleted "${title}". Snapshot preserved in Archive Vault for instant 1-click re-addition.`,
        details: `Original Document ID: ${id} in collection "${collectionName}"`,
        previousData: data,
        canRestore: true,
        tags: ['Archive', 'Deleted', entityType],
      });
    }
  } catch (err) {
    console.warn('Archive before delete notice:', err);
  }
}

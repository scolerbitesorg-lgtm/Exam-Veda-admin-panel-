import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type {
  Subject,
  Topic,
  Lecture,
  Note,
  MCQ,
  MockTest,
  MockAttempt,
  MCQAttempt,
  UserProfile,
  AppSettings,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export const defaultSettings: AppSettings = {
  appName: 'Edu Veda',
  tagline: 'भारत का अग्रणी डिजिटल शिक्षा मंच',
  logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
  supportEmail: 'support@eduveda.in',
  supportPhone: '+91 98765 43210',
  themeColor: '#6366f1',
  maintenanceMode: false,
  maintenanceMessage: 'Edu Veda is undergoing scheduled maintenance. We will be back shortly!',
  version: '2.4.0',
  bannerNotice: '🎉 New UPSC & State PSC 2026 Comprehensive Foundation Batches Live!',
  showBanner: true,
  geminiApiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
  geminiModel: 'gemini-2.5-flash',
  groqApiKey: (import.meta.env.VITE_GROQ_API_KEY as string) || '',
  securitySettings: {
    singleDeviceLogin: true,
    blockScreenshots: true,
    blockRootedDevices: true,
    enableDynamicWatermark: true,
    maxExamTabSwitches: 3,
    allowAccountSelfDeletion: true,
    sessionEpoch: 1,
  },
  rateLimitSettings: {
    dailyAiLimitFree: 10,
    dailyAiLimitPro: 100,
    dailyPdfLimitFree: 5,
    maxConcurrentStreams: 1,
  },
  popupBanner: {
    enabled: false,
    title: '🎯 Special Live Exam & Scholarship Batch 2026',
    subtitle: 'Flat 50% Off for next 24 Hours! Use code VEDA50',
    badgeText: 'LIMITED TIME OFFER',
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80',
    actionText: 'Explore Batches Now',
    actionUrl: 'tab:courses',
    showOncePerSession: true,
  },
  aiMultiProviders: {
    enableAutoFailover: true,
    primaryProvider: 'auto',
    fallbackProvider: 'auto',
    activeOrder: ['groq', 'openrouter', 'gemini', 'openai', 'anthropic'],
    providers: {
      groq: {
        id: 'groq',
        name: 'Groq Cloud (LPU Ultra Fast)',
        enabled: true,
        apiKey: (import.meta.env.VITE_GROQ_API_KEY as string) || '',
        model: 'llama-3.3-70b-versatile',
        priority: 1,
        status: 'connected',
        baseUrl: 'https://api.groq.com/openai/v1',
      },
      gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        enabled: true,
        apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
        model: 'gemini-2.5-flash',
        priority: 2,
        status: 'connected',
      },
      openrouter: {
        id: 'openrouter',
        name: 'OpenRouter Multi-Model',
        enabled: true,
        apiKey: (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        priority: 3,
        status: 'connected',
        baseUrl: 'https://openrouter.ai/api/v1',
      },
    },
    groq: {
      id: 'groq',
      name: 'Groq Cloud (LPU Ultra Fast)',
      enabled: true,
      apiKey: (import.meta.env.VITE_GROQ_API_KEY as string) || '',
      model: 'llama-3.3-70b-versatile',
      priority: 1,
      status: 'connected',
      baseUrl: 'https://api.groq.com/openai/v1',
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      enabled: true,
      apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
      model: 'gemini-2.5-flash',
      priority: 2,
      status: 'connected',
    },
    openrouter: {
      id: 'openrouter',
      name: 'OpenRouter Multi-Model',
      enabled: true,
      apiKey: (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      priority: 3,
      status: 'connected',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
  },
};

/**
 * Strips undefined properties recursively so Firestore never throws
 * "Function addDoc() / updateDoc() called with invalid data. Unsupported field value: undefined"
 */
export function cleanDocData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanDocData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// ================= APP SETTINGS =================
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, 'appSettings', 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...defaultSettings, ...(snap.data() as AppSettings) };
    } else {
      await setDoc(docRef, cleanDocData(defaultSettings));
      return defaultSettings;
    }
  } catch (err) {
    console.error('Failed to get app settings:', err);
    return defaultSettings;
  }
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const docRef = doc(db, 'appSettings', 'general');
  await setDoc(docRef, cleanDocData(settings), { merge: true });
}

// ================= SUBJECTS =================
export async function getSubjects(): Promise<Subject[]> {
  try {
    const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subject));
  } catch (err) {
    console.error('Error fetching subjects:', err);
    return [];
  }
}

export function subscribeSubjects(callback: (subjects: Subject[]) => void) {
  const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subject));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'subjects');
    }
  );
}

export async function addSubject(subject: Omit<Subject, 'id'>): Promise<string> {
  const colRef = collection(db, 'subjects');
  const now = new Date().toISOString();
  const res = await addDoc(colRef, cleanDocData({
    ...subject,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

export async function updateSubject(id: string, updates: Partial<Subject>): Promise<void> {
  const docRef = doc(db, 'subjects', id);
  await updateDoc(docRef, cleanDocData({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteSubject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'subjects', id));
}

export async function deleteAllSubjects(): Promise<{ deletedCount: number }> {
  const snap = await getDocs(collection(db, 'subjects'));
  if (snap.empty) return { deletedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalDeleted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return { deletedCount: totalDeleted };
}

// ================= TOPICS =================
export async function getTopics(subjectId?: string): Promise<Topic[]> {
  try {
    let q = query(collection(db, 'topics'), orderBy('order', 'asc'));
    if (subjectId) {
      q = query(collection(db, 'topics'), where('subjectId', '==', subjectId), orderBy('order', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Topic));
  } catch (err) {
    console.error('Error fetching topics:', err);
    return [];
  }
}

export function subscribeTopics(callback: (topics: Topic[]) => void, subjectId?: string) {
  let q = query(collection(db, 'topics'), orderBy('order', 'asc'));
  if (subjectId) {
    q = query(collection(db, 'topics'), where('subjectId', '==', subjectId), orderBy('order', 'asc'));
  }
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Topic));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'topics');
    }
  );
}

export async function addTopic(topic: Omit<Topic, 'id'>): Promise<string> {
  const colRef = collection(db, 'topics');
  const now = new Date().toISOString();
  const res = await addDoc(colRef, cleanDocData({
    ...topic,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

export async function updateTopic(id: string, updates: Partial<Topic>): Promise<void> {
  const docRef = doc(db, 'topics', id);
  await updateDoc(docRef, cleanDocData({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteTopic(id: string): Promise<void> {
  await deleteDoc(doc(db, 'topics', id));
}

export async function deleteAllTopics(): Promise<{ deletedCount: number }> {
  const snap = await getDocs(collection(db, 'topics'));
  if (snap.empty) return { deletedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalDeleted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return { deletedCount: totalDeleted };
}

// ================= LECTURES =================
export async function getLectures(topicId?: string): Promise<Lecture[]> {
  try {
    let q = query(collection(db, 'lectures'), orderBy('order', 'asc'));
    if (topicId) {
      q = query(collection(db, 'lectures'), where('topicId', '==', topicId), orderBy('order', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lecture));
  } catch (err) {
    console.error('Error fetching lectures:', err);
    return [];
  }
}

export function subscribeLectures(callback: (lectures: Lecture[]) => void, topicId?: string) {
  let q = query(collection(db, 'lectures'), orderBy('order', 'asc'));
  if (topicId) {
    q = query(collection(db, 'lectures'), where('topicId', '==', topicId), orderBy('order', 'asc'));
  }
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lecture));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'lectures');
    }
  );
}

export async function addLecture(lecture: Omit<Lecture, 'id'>): Promise<string> {
  const colRef = collection(db, 'lectures');
  const now = new Date().toISOString();
  const res = await addDoc(colRef, cleanDocData({
    ...lecture,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

export async function updateLecture(id: string, updates: Partial<Lecture>): Promise<void> {
  const docRef = doc(db, 'lectures', id);
  await updateDoc(docRef, cleanDocData({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteLecture(id: string): Promise<void> {
  await deleteDoc(doc(db, 'lectures', id));
}

export async function deleteAllLectures(): Promise<{ deletedCount: number }> {
  const snap = await getDocs(collection(db, 'lectures'));
  if (snap.empty) return { deletedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalDeleted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return { deletedCount: totalDeleted };
}

// ================= NOTES =================
export async function getNotes(topicId?: string): Promise<Note[]> {
  try {
    let q = query(collection(db, 'notes'));
    if (topicId) {
      q = query(collection(db, 'notes'), where('topicId', '==', topicId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
  } catch (err) {
    console.error('Error fetching notes:', err);
    return [];
  }
}

export function subscribeNotes(callback: (notes: Note[]) => void, topicId?: string) {
  let q = query(collection(db, 'notes'));
  if (topicId) {
    q = query(collection(db, 'notes'), where('topicId', '==', topicId));
  }
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'notes');
    }
  );
}

export async function addNote(note: Omit<Note, 'id'>): Promise<string> {
  const colRef = collection(db, 'notes');
  const now = new Date().toISOString();
  const res = await addDoc(colRef, cleanDocData({
    ...note,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const docRef = doc(db, 'notes', id);
  await updateDoc(docRef, cleanDocData({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notes', id));
}

export async function deleteAllNotes(): Promise<{ deletedCount: number }> {
  const snap = await getDocs(collection(db, 'notes'));
  if (snap.empty) return { deletedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalDeleted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return { deletedCount: totalDeleted };
}

// ================= MCQs =================
export async function getMCQs(topicId?: string): Promise<MCQ[]> {
  try {
    let q = query(collection(db, 'mcqs'));
    if (topicId) {
      q = query(collection(db, 'mcqs'), where('topicId', '==', topicId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MCQ));
  } catch (err) {
    console.error('Error fetching MCQs:', err);
    return [];
  }
}

export function subscribeMCQs(callback: (mcqs: MCQ[]) => void, topicId?: string) {
  let q = query(collection(db, 'mcqs'));
  if (topicId) {
    q = query(collection(db, 'mcqs'), where('topicId', '==', topicId));
  }
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MCQ));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'mcqs');
    }
  );
}

export async function addMCQ(mcq: Omit<MCQ, 'id'>): Promise<string> {
  const colRef = collection(db, 'mcqs');
  const now = new Date().toISOString();
  const res = await addDoc(colRef, cleanDocData({
    ...mcq,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

export async function addMCQsBatch(
  mcqsList: Array<Omit<MCQ, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ insertedCount: number }> {
  if (mcqsList.length === 0) return { insertedCount: 0 };
  const now = new Date().toISOString();
  const chunkSize = 400;
  let totalInserted = 0;

  for (let i = 0; i < mcqsList.length; i += chunkSize) {
    const chunk = mcqsList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const newDocRef = doc(collection(db, 'mcqs'));
      batch.set(newDocRef, cleanDocData({
        ...item,
        createdAt: now,
        updatedAt: now,
      }));
    });
    await batch.commit();
    totalInserted += chunk.length;
  }
  return { insertedCount: totalInserted };
}

export async function deleteAllMCQs(): Promise<{ deletedCount: number }> {
  const snap = await getDocs(collection(db, 'mcqs'));
  if (snap.empty) return { deletedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalDeleted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return { deletedCount: totalDeleted };
}

export async function updateMCQ(id: string, updates: Partial<MCQ>): Promise<void> {
  const docRef = doc(db, 'mcqs', id);
  await updateDoc(docRef, cleanDocData({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteMCQ(id: string): Promise<void> {
  await deleteDoc(doc(db, 'mcqs', id));
}

// ================= MOCK TESTS =================
export async function getMockTests(): Promise<MockTest[]> {
  try {
    const q = query(collection(db, 'mockTests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MockTest));
  } catch (err) {
    console.error('Error fetching mock tests:', err);
    return [];
  }
}

export function subscribeMockTests(callback: (mockTests: MockTest[]) => void) {
  const q = query(collection(db, 'mockTests'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MockTest));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'mockTests');
    }
  );
}

export async function addMockTest(mock: Omit<MockTest, 'id'>): Promise<string> {
  const colRef = collection(db, 'mockTests');
  const now = new Date().toISOString();
  const res = await addDoc(colRef, cleanDocData({
    ...mock,
    createdAt: now,
    updatedAt: now,
  }));
  return res.id;
}

export async function updateMockTest(id: string, updates: Partial<MockTest>): Promise<void> {
  const docRef = doc(db, 'mockTests', id);
  await updateDoc(docRef, cleanDocData({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));
}

export async function deleteMockTest(id: string): Promise<void> {
  await deleteDoc(doc(db, 'mockTests', id));
}

export async function deleteAllMockTests(): Promise<{ deletedCount: number }> {
  const snap = await getDocs(collection(db, 'mockTests'));
  if (snap.empty) return { deletedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalDeleted = 0;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }
  return { deletedCount: totalDeleted };
}

export async function bulkInsertMockTests(mockList: Omit<MockTest, 'id'>[]): Promise<{ insertedCount: number }> {
  if (mockList.length === 0) return { insertedCount: 0 };
  const now = new Date().toISOString();
  const chunkSize = 400;
  let totalInserted = 0;

  for (let i = 0; i < mockList.length; i += chunkSize) {
    const chunk = mockList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const newDocRef = doc(collection(db, 'mockTests'));
      batch.set(newDocRef, {
        ...item,
        createdAt: item.createdAt || now,
        updatedAt: now,
      });
    });
    await batch.commit();
    totalInserted += chunk.length;
  }
  return { insertedCount: totalInserted };
}

// ================= USER PROFILES & ATTEMPTS =================
export async function getUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}

export function subscribeUsers(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, 'users'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      callback(list);
    },
    (err) => {
      console.warn('Users subscription notice:', err.message);
      callback([]);
    }
  );
}

export async function updateUserRole(uid: string, role: 'user' | 'admin' | 'instructor'): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    role,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateUserRoleWithExpiry(
  uid: string,
  role: 'developer' | 'content_admin' | 'admin' | 'user' | 'instructor',
  isTemporary?: boolean,
  roleExpiresAt?: string | null,
  durationMinutes?: number
): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    role,
    isTemporary: !!isTemporary,
    roleExpiresAt: roleExpiresAt || null,
    temporaryDurationMinutes: durationMinutes || null,
    temporaryGrantedAt: isTemporary ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteUserAccount(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await deleteDoc(docRef);
}

export async function getMockAttempts(): Promise<MockAttempt[]> {
  try {
    const q = query(collection(db, 'mockAttempts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MockAttempt));
  } catch (err) {
    console.error('Error fetching mock attempts:', err);
    return [];
  }
}

export function subscribeMockAttempts(callback: (attempts: MockAttempt[]) => void) {
  const q = query(collection(db, 'mockAttempts'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MockAttempt));
      callback(list);
    },
    (err) => {
      console.warn('Mock attempts subscription notice:', err.message);
      callback([]);
    }
  );
}

export async function getMCQAttempts(): Promise<MCQAttempt[]> {
  try {
    const q = query(collection(db, 'mcqAttempts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MCQAttempt));
  } catch (err) {
    console.error('Error fetching mcq attempts:', err);
    return [];
  }
}

export function subscribeMCQAttempts(callback: (attempts: MCQAttempt[]) => void) {
  const q = query(collection(db, 'mcqAttempts'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MCQAttempt));
      callback(list);
    },
    (err) => {
      console.warn('MCQ attempts subscription notice:', err.message);
      callback([]);
    }
  );
}

export function subscribeAppSettings(callback: (settings: AppSettings | null) => void) {
  const docRef = doc(db, 'appSettings', 'general');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...defaultSettings, ...(snapshot.data() as AppSettings) });
      } else {
        callback(defaultSettings);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'appSettings/general');
      callback(defaultSettings);
    }
  );
}

export async function bulkUpdateContentStatus(
  collectionName: 'subjects' | 'topics' | 'lectures' | 'notes' | 'mcqs' | 'mocktests' | 'mockTests',
  published: boolean
): Promise<{ updatedCount: number }> {
  const targetCol = collectionName === 'mocktests' ? 'mockTests' : collectionName;
  const snap = await getDocs(collection(db, targetCol));
  if (snap.empty) return { updatedCount: 0 };
  const docs = snap.docs;
  const chunkSize = 400;
  let totalUpdated = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => {
      batch.update(d.ref, { published, updatedAt: now });
    });
    await batch.commit();
    totalUpdated += chunk.length;
  }
  return { updatedCount: totalUpdated };
}

// Aliases for intuitive imports
export {
  subscribeSubjects as subscribeToSubjects,
  subscribeTopics as subscribeToTopics,
  subscribeLectures as subscribeToLectures,
  subscribeNotes as subscribeToNotes,
  subscribeMCQs as subscribeToMCQs,
  subscribeMockTests as subscribeToMockTests,
  subscribeUsers as subscribeToUsers,
  subscribeMockAttempts as subscribeToMockAttempts,
  subscribeMCQAttempts as subscribeToMCQAttempts,
  subscribeAppSettings as subscribeToAppSettings,
};

export {
  seedEducationalData,
  seedEducationalData as seedStarterContent,
  clearAllEducationalData,
} from './seedData';


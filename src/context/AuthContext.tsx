import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { UserProfile, UserRole } from '../types';

// ============================================================================
// 🔑 DEVELOPER MASTER RECOVERY & EMERGENCY CREDENTIALS
// In future, agar aap apna developer account/password bhool jate hain, toh
// aap code me is file (/src/context/AuthContext.tsx) me aakar yahan se dekh ya
// apna naya password badal sakte hain.
// ============================================================================
export const DEVELOPER_PRESET = {
  email: 'developer@eduveda.in',
  password: 'Developer@2026!',
  name: 'Lead System Developer',
  role: 'developer' as UserRole,
};

export const MASTER_OWNER_PRESET = {
  email: 'aaravmalik128@gmail.com',
  password: 'Developer@2026!',
  name: 'Lead Master Owner & Developer',
  role: 'developer' as UserRole,
};

export const USER_OWNER_PRESET = {
  email: 'harendramalik090@gmail.com',
  password: 'Developer@2026!',
  name: 'Harendra Malik (Lead Developer & Owner)',
  role: 'developer' as UserRole,
};

export const CONTENT_ADMIN_PRESET = {
  email: 'admin@eduveda.in',
  password: 'Admin@EduVeda2026!',
  name: 'Academic Content Manager',
  role: 'content_admin' as UserRole,
};

export const isUserAccessExpired = (user?: Partial<UserProfile> | null): boolean => {
  if (!user) return false;
  if (user.isExpired === true) return true;
  if (!user.roleExpiresAt) return false;
  const exp = new Date(user.roleExpiresAt).getTime();
  if (isNaN(exp)) return false;
  return exp <= Date.now();
};

interface AuthContextType {
  currentUser: User | { uid: string; email: string; displayName?: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isContentAdmin: boolean;
  canManageSettings: boolean;
  canManageFirebase: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  createTeamMember: (
    name: string,
    email: string,
    pass: string,
    role: 'developer' | 'admin' | 'content_admin',
    mobile?: string,
    isTemporary?: boolean,
    roleExpiresAt?: string,
    durationMinutes?: number
  ) => Promise<void>;
  updateTeamMemberPassword: (uid: string, newPass: string) => Promise<void>;
  logOut: () => Promise<void>;
  loginAsDeveloper: () => Promise<void>;
  loginAsContentAdmin: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<
    User | { uid: string; email: string; displayName?: string } | null
  >(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to determine role based on email or profile
  const deriveRole = (email?: string | null, savedRole?: UserRole, roleExpiresAt?: string): UserRole => {
    // If temporary role has expired, downgrade to normal student/user
    if (roleExpiresAt) {
      const exp = new Date(roleExpiresAt).getTime();
      if (!isNaN(exp) && exp <= Date.now()) {
        return 'user';
      }
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    if (
      cleanEmail === 'developer@eduveda.in' ||
      cleanEmail === 'aaravmalik128@gmail.com' ||
      cleanEmail === 'harendramalik090@gmail.com' ||
      (cleanEmail.includes('developer') && !roleExpiresAt) ||
      savedRole === 'developer'
    ) {
      return 'developer';
    }
    if (
      cleanEmail === 'admin@eduveda.in' ||
      (cleanEmail.includes('admin') && !roleExpiresAt) ||
      savedRole === 'content_admin' ||
      savedRole === 'admin'
    ) {
      return 'content_admin';
    }
    return savedRole || 'content_admin';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const existing = docSnap.data() as UserProfile;
            const updatedRole = deriveRole(user.email, existing.role, existing.roleExpiresAt);
            const fullProfile: UserProfile = {
              ...existing,
              role: updatedRole,
            };
            setUserProfile(fullProfile);
          } else {
            // Check if there is an existing doc created by developer query by email
            const q = query(
              collection(db, 'users'),
              where('email', '==', (user.email || '').toLowerCase().trim())
            );
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const matched = querySnap.docs[0].data() as UserProfile;
              setUserProfile({
                ...matched,
                uid: user.uid,
                role: deriveRole(user.email, matched.role, matched.roleExpiresAt),
              });
            } else {
              const role = deriveRole(user.email);
              const newProfile: UserProfile = {
                uid: user.uid,
                name:
                  user.displayName ||
                  (role === 'developer' ? 'Lead Master Developer' : 'Academic Content Manager'),
                email: user.email || '',
                role,
                assignedPassword:
                  role === 'developer' ? DEVELOPER_PRESET.password : CONTENT_ADMIN_PRESET.password,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newProfile);
              setUserProfile(newProfile);
            }
          }
        } catch (err) {
          console.warn('Error fetching user profile doc:', err);
          const role = deriveRole(user.email);
          setUserProfile({
            uid: user.uid,
            name: user.displayName || (role === 'developer' ? 'Developer' : 'Admin'),
            email: user.email || '',
            role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // If not logged in via Firebase Auth, keep state null unless custom session exists
        if (!userProfile) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Active Session Expiration Watcher for Temporary Developers / Admins
  useEffect(() => {
    if (!currentUser) return;

    let isProcessingExpiry = false;
    const checkActiveSession = async () => {
      if (isProcessingExpiry) return;

      const hasExpiryTimestamp = !!userProfile?.roleExpiresAt;
      const isPastExpiryTime =
        hasExpiryTimestamp &&
        new Date(userProfile!.roleExpiresAt!).getTime() <= Date.now();
      const isMarkedExpired = isUserAccessExpired(userProfile);

      if (isPastExpiryTime || isMarkedExpired) {
        isProcessingExpiry = true;
        const userEmail = (userProfile?.email || currentUser.email || '').toLowerCase().trim();

        // 1. Permanently invalidate user record in Firestore so credentials become completely invalid
        if (userEmail) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', userEmail));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
              await updateDoc(doc(db, 'users', d.id), {
                isExpired: true,
                role: 'user',
                assignedPassword: 'EXPIRED_INVALID_' + Date.now(),
                updatedAt: new Date().toISOString(),
              });
            }
          } catch (dbErr) {
            console.warn('DB record invalidation error:', dbErr);
          }
        }

        // 2. Terminate Firebase auth session
        try {
          await signOut(auth);
        } catch {
          // ignore
        }

        // 3. Clear application state and show explicit expiry alert
        setCurrentUser(null);
        setUserProfile(null);
        setError(
          '🚫 समय सीमा समाप्त (Temporary Access Expired)! आपकी अस्थायी एडमिन/डेवलपर एक्सेस अवधि समाप्त हो चुकी है। यह ईमेल और पासवर्ड अब अमान्य (Invalid) हो चुका है।'
        );
      }
    };

    // Check on mount and every 2 seconds
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 2000);
    return () => clearInterval(interval);
  }, [currentUser, userProfile]);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Firestore database FIRST for the user's latest master assigned password & temporary access status
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const staffDoc = snap.docs[0].data() as UserProfile;
        const staffDocId = snap.docs[0].id;

        const isAccountExpired =
          isUserAccessExpired(staffDoc) ||
          staffDoc.isExpired === true ||
          (staffDoc.roleExpiresAt && new Date(staffDoc.roleExpiresAt).getTime() <= Date.now());

        // CRITICAL: If this is an expired temporary account, BLOCK login immediately & invalidate!
        if (isAccountExpired) {
          try {
            await updateDoc(doc(db, 'users', staffDocId), {
              isExpired: true,
              role: 'user',
              assignedPassword: 'EXPIRED_INVALID_' + Date.now(),
              updatedAt: new Date().toISOString(),
            });
          } catch {
            // ignore
          }
          const expiredMsg =
            '🚫 अमान्य क्रेडेंशियल्स (Temporary Access Expired): इस अस्थायी अकाउंट की निर्धारित समय सीमा समाप्त हो चुकी है। अब यह ईमेल और पासवर्ड लॉगिन के लिए पूरी तरह अमान्य (Invalid) है। कृपया मुख्य डेवलपर से संपर्क करें।';
          setError(expiredMsg);
          throw new Error(expiredMsg);
        }

        // If an explicit password exists in Firestore, ONLY that password is valid!
        if (staffDoc.assignedPassword) {
          if (staffDoc.assignedPassword !== pass) {
            const wrongPassMsg = 'गलत पासवर्ड (Incorrect Password)। कृपया सही पासवर्ड दर्ज करें। पुराना या अमान्य पासवर्ड स्वीकार नहीं होगा।';
            setError(wrongPassMsg);
            throw new Error(wrongPassMsg);
          }

          // Valid new password! Proceed to login
          try {
            const authRes = await signInWithEmailAndPassword(auth, cleanEmail, pass);
            setCurrentUser(authRes.user);
          } catch {
            // If Auth user password wasn't synced or Auth user doesn't exist, create/grant session
            const customUser = {
              uid: staffDoc.uid || staffDocId,
              email: cleanEmail,
              displayName: staffDoc.name,
            };
            setCurrentUser(customUser);
          }

          const computedRole = deriveRole(cleanEmail, staffDoc.role, staffDoc.roleExpiresAt);
          setUserProfile({
            ...staffDoc,
            uid: staffDoc.uid || staffDocId,
            role: computedRole,
          });
          return;
        }
      }
    } catch (dbErr: any) {
      if (dbErr.message && (dbErr.message.includes('गलत पासवर्ड') || dbErr.message.includes('अमान्य क्रेडेंशियल्स') || dbErr.message.includes('Temporary Access Expired'))) {
        throw dbErr;
      }
      console.warn('Firestore password check notice:', dbErr);
    }

    // 2. Try standard Firebase Auth sign in
    try {
      const authRes = await signInWithEmailAndPassword(auth, cleanEmail, pass);

      // Check if user document has temporary expiration
      try {
        const uDoc = await getDoc(doc(db, 'users', authRes.user.uid));
        if (uDoc.exists()) {
          const p = uDoc.data() as UserProfile;
          if (
            isUserAccessExpired(p) ||
            p.isExpired ||
            (p.roleExpiresAt && new Date(p.roleExpiresAt).getTime() <= Date.now())
          ) {
            await signOut(auth);
            try {
              await updateDoc(doc(db, 'users', authRes.user.uid), {
                isExpired: true,
                role: 'user',
                assignedPassword: 'EXPIRED_INVALID_' + Date.now(),
                updatedAt: new Date().toISOString(),
              });
            } catch {
              // ignore
            }
            const expMsg =
              '🚫 अमान्य क्रेडेंशियल्स (Temporary Access Expired): इस अस्थायी अकाउंट की निर्धारित समय सीमा समाप्त हो चुकी है। अब यह ईमेल और पासवर्ड लॉगिन के लिए अमान्य (Invalid) है।';
            setError(expMsg);
            throw new Error(expMsg);
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Temporary Access Expired')) throw err;
      }

      setCurrentUser(authRes.user);
      return;
    } catch (authErr: any) {
      if (authErr.message && authErr.message.includes('अस्थायी एक्सेस')) {
        throw authErr;
      }
      console.warn('Firebase Auth sign-in attempted:', authErr.code);

      // 3. Preset fallback (Only if no custom password was assigned in Firestore)
      if (
        (cleanEmail === DEVELOPER_PRESET.email && pass === DEVELOPER_PRESET.password) ||
        (cleanEmail === MASTER_OWNER_PRESET.email && pass === MASTER_OWNER_PRESET.password) ||
        (cleanEmail === USER_OWNER_PRESET.email && pass === USER_OWNER_PRESET.password) ||
        (cleanEmail === CONTENT_ADMIN_PRESET.email && pass === CONTENT_ADMIN_PRESET.password)
      ) {
        try {
          const isDev =
            cleanEmail === DEVELOPER_PRESET.email ||
            cleanEmail === MASTER_OWNER_PRESET.email ||
            cleanEmail === USER_OWNER_PRESET.email;
          const preset =
            cleanEmail === USER_OWNER_PRESET.email
              ? USER_OWNER_PRESET
              : cleanEmail === MASTER_OWNER_PRESET.email
              ? MASTER_OWNER_PRESET
              : isDev
              ? DEVELOPER_PRESET
              : CONTENT_ADMIN_PRESET;
          const res = await createUserWithEmailAndPassword(auth, preset.email, preset.password);
          await updateProfile(res.user, { displayName: preset.name });
          const p: UserProfile = {
            uid: res.user.uid,
            name: preset.name,
            email: preset.email,
            role: preset.role,
            assignedPassword: preset.password,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', res.user.uid), p);
          setCurrentUser(res.user);
          setUserProfile(p);
          return;
        } catch (innerCreateErr) {
          const isDev =
            cleanEmail === DEVELOPER_PRESET.email ||
            cleanEmail === MASTER_OWNER_PRESET.email ||
            cleanEmail === USER_OWNER_PRESET.email;
          const preset =
            cleanEmail === USER_OWNER_PRESET.email
              ? USER_OWNER_PRESET
              : cleanEmail === MASTER_OWNER_PRESET.email
              ? MASTER_OWNER_PRESET
              : isDev
              ? DEVELOPER_PRESET
              : CONTENT_ADMIN_PRESET;
          const p: UserProfile = {
            uid: 'preset_' + (isDev ? 'dev' : 'admin'),
            name: preset.name,
            email: preset.email,
            role: preset.role,
            assignedPassword: preset.password,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCurrentUser({ uid: p.uid, email: p.email, displayName: p.name });
          setUserProfile(p);
          return;
        }
      }

      let msg = 'अमान्य ईमेल या पासवर्ड (Invalid Email or Password)। कृपया सही क्रेडेंशियल्स दर्ज करें।';
      if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
        msg = 'गलत पासवर्ड (Incorrect Password)। कृपया सही पासवर्ड दर्ज करें।';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  // Dedicated function for Developers to invite/appoint new Admins or 2nd Developer (Permanent or Temporary)
  const createTeamMember = async (
    name: string,
    email: string,
    pass: string,
    role: 'developer' | 'admin' | 'content_admin',
    mobile?: string,
    isTemporary?: boolean,
    roleExpiresAt?: string,
    durationMinutes?: number
  ) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    try {
      const sanitizedDocId = 'staff_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const newStaffDoc: UserProfile = {
        uid: sanitizedDocId,
        name,
        email: cleanEmail,
        mobile: mobile || '',
        role: role === 'admin' ? 'content_admin' : role,
        isCoDeveloper: role === 'developer',
        assignedPassword: pass, // Stored for Developer inspection & automatic login verification
        isTemporary: !!isTemporary,
        roleExpiresAt: roleExpiresAt || undefined,
        temporaryDurationMinutes: durationMinutes || undefined,
        temporaryGrantedAt: isTemporary ? new Date().toISOString() : undefined,
        temporaryGrantedBy: currentUser?.email || 'Lead Developer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save directly to Firestore users collection
      await setDoc(doc(db, 'users', sanitizedDocId), newStaffDoc);
    } catch (err: any) {
      console.warn('Create staff member error:', err);
      setError(err.message || 'Failed to appoint staff member.');
      throw err;
    }
  };

  const updateTeamMemberPassword = async (uid: string, newPass: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        assignedPassword: newPass,
        updatedAt: new Date().toISOString(),
      });

      // Also find any doc with matching email in case UID is different
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.data() as UserProfile;
        if (udata.email) {
          const q = query(collection(db, 'users'), where('email', '==', udata.email.toLowerCase().trim()));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            if (d.id !== uid) {
              await updateDoc(doc(db, 'users', d.id), {
                assignedPassword: newPass,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (err: any) {
      throw new Error('Failed to update password: ' + err.message);
    }
  };

  const loginAsDeveloper = async () => {
    setError(null);
    try {
      await signIn(DEVELOPER_PRESET.email, DEVELOPER_PRESET.password);
    } catch (err: any) {
      setError(err.message || 'Failed to log in as Developer.');
    }
  };

  const loginAsContentAdmin = async () => {
    setError(null);
    try {
      await signIn(CONTENT_ADMIN_PRESET.email, CONTENT_ADMIN_PRESET.password);
    } catch (err: any) {
      setError(err.message || 'Failed to log in as Content Admin.');
    }
  };

  const logOut = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const clearError = () => setError(null);

  // Role permissions
  const isExpired = isUserAccessExpired(userProfile);

  const isDeveloper =
    !isExpired &&
    (userProfile?.role === 'developer' ||
      userProfile?.email?.toLowerCase() === 'developer@eduveda.in' ||
      userProfile?.email?.toLowerCase() === 'aaravmalik128@gmail.com' ||
      userProfile?.email?.toLowerCase() === 'harendramalik090@gmail.com' ||
      userProfile?.isCoDeveloper === true);

  const isContentAdmin =
    !isExpired &&
    !isDeveloper &&
    (userProfile?.role === 'content_admin' || userProfile?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin: !isExpired && (isDeveloper || isContentAdmin),
        isDeveloper,
        isContentAdmin,
        canManageSettings: isDeveloper,
        canManageFirebase: isDeveloper,
        signIn,
        createTeamMember,
        updateTeamMemberPassword,
        logOut,
        loginAsDeveloper,
        loginAsContentAdmin,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

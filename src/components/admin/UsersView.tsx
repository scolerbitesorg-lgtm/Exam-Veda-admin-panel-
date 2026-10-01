import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  UserPlus,
  Shield,
  Code2,
  Key,
  Mail,
  Eye,
  EyeOff,
  Copy,
  Edit3,
  Check,
  GraduationCap,
  Sparkles,
  Lock,
  Trash2,
  Hourglass,
  Timer,
  AlertTriangle,
  RotateCcw,
  Zap,
  Calendar,
} from 'lucide-react';
import {
  updateUserRole,
  updateUserRoleWithExpiry,
  deleteUserAccount,
} from '../../services/dbService';
import { useAuth, DEVELOPER_PRESET, CONTENT_ADMIN_PRESET } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  formatTimeRemaining,
  calculateExpiryTimestamp,
  toLocalDatetimeInputValue,
  fromLocalDatetimeInputValue,
  formatReadableDate,
} from '../../utils/announcementUtils';
import type { UserProfile, MockAttempt, MCQAttempt } from '../../types';

interface UsersViewProps {
  users: UserProfile[];
  mockAttempts: MockAttempt[];
  mcqAttempts: MCQAttempt[];
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  mockAttempts,
  mcqAttempts,
}) => {
  const { isDeveloper, createTeamMember, updateTeamMemberPassword } = useAuth();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'team' | 'students' | 'mockAttempts' | 'mcqAttempts'>(
    isDeveloper ? 'team' : 'students'
  );
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // 1-second interval ticker for live countdown of temporary credentials
  const [, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Global password visibility
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswordUids, setVisiblePasswordUids] = useState<Record<string, boolean>>({});
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Appoint modal state
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [appointName, setAppointName] = useState('');
  const [appointEmail, setAppointEmail] = useState('');
  const [appointPassword, setAppointPassword] = useState('');
  const [appointMobile, setAppointMobile] = useState('');
  const [appointRole, setAppointRole] = useState<'developer' | 'admin' | 'content_admin'>('content_admin');
  const [appointSubmitting, setAppointSubmitting] = useState(false);
  const [appointSuccess, setAppointSuccess] = useState(false);

  // Temporary access controls inside Appoint Modal
  const [appointIsTemporary, setAppointIsTemporary] = useState(false);
  const [appointDurationVal, setAppointDurationVal] = useState<string>('24');
  const [appointDurationUnit, setAppointDurationUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('hours');
  const [appointCustomDatetime, setAppointCustomDatetime] = useState<string>('');

  // Universal Manage Access & Expiry Modal (Convert Permanent <-> Temporary for ANY user)
  const [manageAccessUser, setManageAccessUser] = useState<UserProfile | null>(null);
  const [manageRole, setManageRole] = useState<'developer' | 'content_admin' | 'admin' | 'instructor' | 'user'>('content_admin');
  const [manageIsTemporary, setManageIsTemporary] = useState<boolean>(false);
  const [manageDurationVal, setManageDurationVal] = useState<string>('24');
  const [manageDurationUnit, setManageDurationUnit] = useState<'minutes' | 'hours' | 'days' | 'months' | 'years'>('hours');
  const [manageCustomDatetime, setManageCustomDatetime] = useState<string>('');
  const [manageSubmitting, setManageSubmitting] = useState<boolean>(false);

  // Quick Extend Access Modal
  const [extendModalUser, setExtendModalUser] = useState<UserProfile | null>(null);
  const [extendVal, setExtendVal] = useState<string>('1');
  const [extendUnit, setExtendUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('hours');
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  // Edit password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordEditUser, setPasswordEditUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Elevate Student modal state
  const [elevateUser, setElevateUser] = useState<UserProfile | null>(null);
  const [elevateRole, setElevateRole] = useState<'developer' | 'content_admin'>('content_admin');
  const [elevateIsTemp, setElevateIsTemp] = useState(true);
  const [elevateDurationVal, setElevateDurationVal] = useState<string>('24');
  const [elevateDurationUnit, setElevateDurationUnit] = useState<'minutes' | 'hours' | 'days' | 'months'>('hours');
  const [elevateSubmitting, setElevateSubmitting] = useState(false);

  // Filter team members vs Regular Students
  const teamMembers = users.filter(
    (u) =>
      u.role === 'developer' ||
      u.role === 'admin' ||
      u.role === 'content_admin' ||
      u.role === 'instructor' ||
      u.isTemporary === true ||
      u.email?.toLowerCase() === 'developer@eduveda.in' ||
      u.email?.toLowerCase() === 'aaravmalik128@gmail.com' ||
      u.email?.toLowerCase() === 'harendramalik090@gmail.com' ||
      u.email?.toLowerCase() === 'admin@eduveda.in' ||
      u.uid.startsWith('staff_')
  );

  const studentUsers = users.filter((u) => !teamMembers.some((t) => t.uid === u.uid));

  const filteredTeam = teamMembers.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.mobile || '').includes(term)
    );
  });

  const filteredStudents = studentUsers.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.mobile || '').includes(term)
    );
  });

  const getUserPassword = (user: UserProfile) => {
    if (user.assignedPassword) return user.assignedPassword;
    if (user.password) return user.password;
    if (user.email === DEVELOPER_PRESET.email) return DEVELOPER_PRESET.password;
    if (user.email === CONTENT_ADMIN_PRESET.email) return CONTENT_ADMIN_PRESET.password;
    if (user.role === 'user') return 'Student@123';
    return 'Admin@2026!';
  };

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswordUids((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  const handleCopyCredentials = (user: UserProfile) => {
    const pass = getUserPassword(user);
    const expText = user.isTemporary
      ? user.roleExpiresAt
        ? `\nAccess Expiry: ${formatReadableDate(user.roleExpiresAt)}`
        : '\nAccess: Temporary'
      : '\nAccess: Permanent';

    const text = `🔐 Edu Veda User Credentials\nName: ${user.name || 'User'}\nRole: ${
      user.role || 'Student'
    }${expText}\nEmail: ${user.email}\nPassword: ${pass}\nPortal: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedUid(user.uid);
    toast.success(`Credentials copied for ${user.email}`, 'Copied to Clipboard');
    setTimeout(() => setCopiedUid(null), 2500);
  };

  const openManageAccessModal = (user: UserProfile) => {
    setManageAccessUser(user);
    const validRole: 'developer' | 'content_admin' | 'admin' | 'instructor' | 'user' =
      user.role === 'developer'
        ? 'developer'
        : user.role === 'instructor'
        ? 'instructor'
        : user.role === 'user'
        ? 'user'
        : 'content_admin';
    setManageRole(validRole);
    setManageIsTemporary(user.isTemporary ?? false);
    if (user.roleExpiresAt) {
      setManageCustomDatetime(toLocalDatetimeInputValue(user.roleExpiresAt));
    } else {
      setManageCustomDatetime('');
      setManageDurationVal('24');
      setManageDurationUnit('hours');
    }
  };

  const handleSaveManageAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageAccessUser || !isDeveloper) return;
    setManageSubmitting(true);
    try {
      let roleExpiresAt: string | null = null;
      let durationMinutes: number | undefined = undefined;

      if (manageIsTemporary) {
        if (manageCustomDatetime) {
          roleExpiresAt = fromLocalDatetimeInputValue(manageCustomDatetime);
          const diffMs = new Date(roleExpiresAt).getTime() - Date.now();
          durationMinutes = Math.max(1, Math.round(diffMs / 60000));
        } else {
          const numVal = Math.max(1, parseInt(manageDurationVal) || 1);
          roleExpiresAt = calculateExpiryTimestamp(numVal, manageDurationUnit);
          durationMinutes =
            manageDurationUnit === 'minutes'
              ? numVal
              : manageDurationUnit === 'hours'
              ? numVal * 60
              : manageDurationUnit === 'days'
              ? numVal * 1440
              : manageDurationUnit === 'months'
              ? numVal * 43200
              : numVal * 525600;
        }
      }

      await updateUserRoleWithExpiry(
        manageAccessUser.uid,
        manageRole,
        manageIsTemporary,
        roleExpiresAt,
        durationMinutes
      );

      toast.success(
        manageIsTemporary
          ? `Access for ${manageAccessUser.name || manageAccessUser.email} set to Temporary (expires on ${formatReadableDate(roleExpiresAt || undefined)}).`
          : `Access for ${manageAccessUser.name || manageAccessUser.email} converted to Permanent!`,
        'Access Updated'
      );
      setManageAccessUser(null);
    } catch (err: any) {
      toast.error('Failed to update access: ' + err.message, 'Update Failed');
    } finally {
      setManageSubmitting(false);
    }
  };

  const handleAppointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      toast.error('Only Lead Developer can appoint administrative accounts.', 'Permission Denied');
      return;
    }
    setAppointSubmitting(true);
    try {
      let roleExpiresAt: string | undefined = undefined;
      let durationMinutes: number | undefined = undefined;

      if (appointIsTemporary) {
        if (appointCustomDatetime) {
          roleExpiresAt = fromLocalDatetimeInputValue(appointCustomDatetime);
          const diffMs = new Date(roleExpiresAt).getTime() - Date.now();
          durationMinutes = Math.max(1, Math.round(diffMs / 60000));
        } else {
          const numVal = Math.max(1, parseInt(appointDurationVal) || 1);
          roleExpiresAt = calculateExpiryTimestamp(numVal, appointDurationUnit);
          durationMinutes =
            appointDurationUnit === 'minutes'
              ? numVal
              : appointDurationUnit === 'hours'
              ? numVal * 60
              : appointDurationUnit === 'days'
              ? numVal * 1440
              : appointDurationUnit === 'months'
              ? numVal * 43200
              : numVal * 525600;
        }
      }

      await createTeamMember(
        appointName,
        appointEmail,
        appointPassword,
        appointRole,
        appointMobile,
        appointIsTemporary,
        roleExpiresAt,
        durationMinutes
      );
      setAppointSuccess(true);
      toast.success(
        appointIsTemporary
          ? `Temporary ${appointRole} created successfully! Automatically expires on ${formatReadableDate(roleExpiresAt)}.`
          : 'Permanent staff account created successfully!',
        'Account Appointed'
      );
      setTimeout(() => {
        setAppointSuccess(false);
        setIsAppointModalOpen(false);
        setAppointName('');
        setAppointEmail('');
        setAppointPassword('');
        setAppointMobile('');
        setAppointIsTemporary(false);
        setAppointDurationVal('24');
        setAppointCustomDatetime('');
      }, 1500);
    } catch (err: any) {
      toast.error('Error appointing staff: ' + err.message, 'Creation Failed');
    } finally {
      setAppointSubmitting(false);
    }
  };

  const handleExtendAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendModalUser || !isDeveloper) return;
    setExtendSubmitting(true);
    try {
      const numVal = Math.max(1, parseInt(extendVal) || 1);
      const newExpiry = calculateExpiryTimestamp(numVal, extendUnit);
      await updateUserRoleWithExpiry(extendModalUser.uid, extendModalUser.role, true, newExpiry);
      toast.success(
        `Access for ${extendModalUser.name || extendModalUser.email} extended by ${numVal} ${extendUnit}!`,
        'Access Extended'
      );
      setExtendModalUser(null);
    } catch (err: any) {
      toast.error('Failed to extend access: ' + err.message, 'Error');
    } finally {
      setExtendSubmitting(false);
    }
  };

  const handleRevokeAccessNow = async (user: UserProfile) => {
    if (!isDeveloper) return;
    try {
      // Set expiry to past date and invalidate password so login blocks immediately
      const pastIso = new Date(Date.now() - 60000).toISOString();
      await updateUserRoleWithExpiry(user.uid, 'user', true, pastIso);
      await updateTeamMemberPassword(user.uid, 'REVOKED_INVALID_' + Date.now());
      toast.warning(`Access revoked for ${user.email}. Login and password are now INVALID.`, 'Access Revoked');
    } catch (err: any) {
      toast.error('Failed to revoke access: ' + err.message, 'Error');
    }
  };

  const handleMakePermanent = async (user: UserProfile) => {
    if (!isDeveloper) return;
    try {
      await updateUserRoleWithExpiry(user.uid, user.role, false, null);
      toast.success(`${user.name || user.email} is now a permanent staff member.`, 'Access Converted');
    } catch (err: any) {
      toast.error('Failed to convert: ' + err.message, 'Error');
    }
  };

  const handleDeleteStaffAccount = async (user: UserProfile) => {
    if (!isDeveloper) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete account ${user.email}? This action cannot be reversed.`
      )
    ) {
      return;
    }
    try {
      await deleteUserAccount(user.uid);
      toast.success(`Account ${user.email} removed from system.`, 'Account Deleted');
    } catch (err: any) {
      toast.error('Failed to delete account: ' + err.message, 'Error');
    }
  };

  const handleElevateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elevateUser || !isDeveloper) return;
    setElevateSubmitting(true);
    try {
      let roleExpiresAt: string | null = null;
      let durationMinutes: number | undefined = undefined;
      if (elevateIsTemp) {
        const numVal = Math.max(1, parseInt(elevateDurationVal) || 1);
        roleExpiresAt = calculateExpiryTimestamp(numVal, elevateDurationUnit);
        durationMinutes =
          elevateDurationUnit === 'minutes'
            ? numVal
            : elevateDurationUnit === 'hours'
            ? numVal * 60
            : elevateDurationUnit === 'days'
            ? numVal * 1440
            : numVal * 43200;
      }
      await updateUserRoleWithExpiry(elevateUser.uid, elevateRole, elevateIsTemp, roleExpiresAt, durationMinutes);
      toast.success(
        `${elevateUser.name || elevateUser.email} has been elevated to ${
          elevateIsTemp ? 'Temporary ' : ''
        }${elevateRole}!`,
        'Student Elevated'
      );
      setElevateUser(null);
    } catch (err: any) {
      toast.error('Failed to elevate user: ' + err.message, 'Error');
    } finally {
      setElevateSubmitting(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordEditUser || !isDeveloper) return;
    setPasswordUpdating(true);
    try {
      await updateTeamMemberPassword(passwordEditUser.uid, newPasswordValue);
      setPasswordSuccess(true);
      toast.success('Password updated in Firestore!', 'Password Changed');
      setTimeout(() => {
        setPasswordSuccess(false);
        setIsPasswordModalOpen(false);
        setPasswordEditUser(null);
        setNewPasswordValue('');
      }, 1500);
    } catch (err: any) {
      toast.error('Error updating password: ' + err.message, 'Update Failed');
    } finally {
      setPasswordUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            User & Access Management (उपयोगकर्ता एवं एडमिन प्रबंधन)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student records, temporary admin & developer accounts, credentials, and live mock exams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Global Reveal Passwords Toggle (Lead Developer Only) */}
          {isDeveloper ? (
            <button
              type="button"
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                showAllPasswords
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={showAllPasswords ? 'Click to mask passwords' : 'Click to show all passwords'}
            >
              {showAllPasswords ? (
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{showAllPasswords ? 'Hide All Passwords' : '👁️ Show All Passwords (Lead Dev)'}</span>
            </button>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 select-none">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>User Passwords Protected (Developer Only)</span>
            </div>
          )}

          {isDeveloper && (
            <button
              onClick={() => setIsAppointModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-indigo-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Appoint Staff / Temporary Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('team')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isDeveloper ? (
            <Shield className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>
            Staff & Admins ({teamMembers.length}) {!isDeveloper && '🔒 (Dev Only)'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Students & Passwords ({studentUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mockAttempts')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'mockAttempts'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Mock Exam Submissions ({mockAttempts.length})</span>
        </button>
      </div>

      {/* ================= LOCKED VIEW FOR CONTENT ADMINS ================= */}
      {activeTab === 'team' && !isDeveloper && (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-50 to-amber-50/30 border border-amber-200/80 text-center max-w-xl mx-auto space-y-4 my-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base">
              Staff & Admin Section Locked (डेवलपर एक्सेस आरक्षित)
            </h3>
            <p className="text-xs text-amber-900 font-semibold">
              🔒 Only Lead Developer (मुख्य सिस्टम डेवलपर) can view and modify staff credentials.
            </p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            सुरक्षा कारणों से, एडमिन एवं स्टाफ अकाउंट्स, पासवर्ड्स और अस्थायी डेवलपर रोल्स का प्रबंधन केवल मुख्य सिस्टम डेवलपर के लिए आरक्षित किया गया है।
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm transition"
            >
              विद्यार्थी सूची पर जाएं (View Students Directory)
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 1: STAFF & TEAM MEMBERS (DEVELOPER ONLY) ================= */}
      {activeTab === 'team' && isDeveloper && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-indigo-400 outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">
                {filteredTeam.length} Staff accounts
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Lead Developer Control
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Member Name</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Role & Access Type</th>
                  <th className="px-5 py-3">Time Remaining (अस्थायी वैधता)</th>
                  <th className="px-5 py-3">Password (पासवर्ड)</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeam.map((u) => {
                  const isDev = u.role === 'developer';
                  const passwordText = getUserPassword(u);
                  const isRevealed = showAllPasswords || !!visiblePasswordUids[u.uid];
                  const remaining = formatTimeRemaining(u.roleExpiresAt);
                  const isExpired = u.isTemporary && remaining.isExpired;

                  return (
                    <tr
                      key={u.uid}
                      className={`transition ${
                        isExpired
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : u.isTemporary
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isDev
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name || 'Admin User'}</span>
                              {isDev && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 text-[9px] font-black uppercase">
                                  Dev
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {u.mobile || '+91 9876543210'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-slate-700 font-mono font-medium">
                        {u.email}
                      </td>

                      {/* Role & Access Type */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border flex items-center gap-1 w-fit ${
                              isDev
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                            }`}
                          >
                            {isDev ? (
                              <Code2 className="w-3 h-3 text-amber-600" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            )}
                            <span>{isDev ? 'Developer' : 'Academic Admin'}</span>
                          </span>

                          {u.isTemporary ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 w-fit ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <Timer className="w-2.5 h-2.5" />
                              <span>{isExpired ? 'Expired / ब्लॉक' : 'Temporary Access'}</span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold">
                              ● Permanent Account
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time Remaining */}
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {u.isTemporary ? (
                          <div className="space-y-0.5">
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                isExpired ? 'text-rose-600' : 'text-amber-800'
                              }`}
                            >
                              <Hourglass className="w-3 h-3" />
                              <span>{remaining.formatted}</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Till: {formatReadableDate(u.roleExpiresAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">Permanent</span>
                        )}
                      </td>

                      {/* Password Column */}
                      <td className="px-5 py-3.5">
                        {isDeveloper ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 flex items-center gap-1.5">
                              <span>{isRevealed ? passwordText : '••••••••••••'}</span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.uid)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                title={isRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isRevealed ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPasswordEditUser(u);
                                setNewPasswordValue(passwordText);
                                setIsPasswordModalOpen(true);
                              }}
                              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 cursor-pointer"
                              title="Reset or Change Password"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 font-mono text-[11px] select-none">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>••••••••••••</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Credentials */}
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(u)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 transition cursor-pointer ${
                              copiedUid === u.uid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                            title="Copy Login Details"
                          >
                            {copiedUid === u.uid ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                            <span>Copy</span>
                          </button>

                          {/* Universal Manage Access & Expiry (Convert Permanent <-> Temporary) */}
                          {isDeveloper && (
                            <button
                              type="button"
                              onClick={() => openManageAccessModal(u)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                                u.isTemporary
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                              }`}
                              title={
                                u.isTemporary
                                  ? 'Edit temporary duration or convert to permanent'
                                  : 'Convert permanent user to temporary with custom expiry'
                              }
                            >
                              <Timer className="w-3 h-3" />
                              <span>{u.isTemporary ? 'Edit Expiry' : 'Make Temp ⏳'}</span>
                            </button>
                          )}

                          {/* Temporary Account Quick Actions */}
                          {u.isTemporary && (
                            <>
                              {/* Extend Access Button */}
                              <button
                                type="button"
                                onClick={() => setExtendModalUser(u)}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] cursor-pointer"
                                title="Extend time duration"
                              >
                                + Extend
                              </button>

                              {/* Revoke Access Button */}
                              {!isExpired && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAccessNow(u)}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[10px] cursor-pointer"
                                  title="Revoke and block login right now"
                                >
                                  Revoke
                                </button>
                              )}

                              {/* Make Permanent */}
                              <button
                                type="button"
                                onClick={() => handleMakePermanent(u)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                                title="Remove timer and make permanent"
                              >
                                Make Perm
                              </button>
                            </>
                          )}

                          {/* Delete Account */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStaffAccount(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REGULAR STUDENTS & ELEVATE TO TEMP ADMIN ================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered students by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-indigo-400 outline-hidden"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {filteredStudents.length} Students registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Mobile Contact</th>
                  <th className="px-5 py-3">{isDeveloper ? 'Student Password / Pin' : 'Security Status'}</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No student accounts recorded in the database yet. Registered mobile/web app users appear here.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((u) => {
                    const passText = getUserPassword(u);
                    const isRevealed = showAllPasswords || !!visiblePasswordUids[u.uid];

                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {u.name?.charAt(0) || 'S'}
                            </div>
                            <span>{u.name || 'Anonymous Student'}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-600 font-medium font-mono">{u.email}</td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono">{u.mobile || '—'}</td>

                        {/* Student Password Column (Confidential - Lead Developer only) */}
                        <td className="px-5 py-3.5">
                          {isDeveloper ? (
                            <div className="flex items-center gap-2">
                              <div className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 flex items-center gap-1.5">
                                <span>{isRevealed ? passText : '••••••••••••'}</span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(u.uid)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  title={isRevealed ? 'Hide Password' : 'Show Password'}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordEditUser(u);
                                  setNewPasswordValue(passText);
                                  setIsPasswordModalOpen(true);
                                }}
                                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Reset Student Password"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 font-mono text-[11px] select-none">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>••••••••••••</span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Student
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Credentials for Lead Dev, or Copy Contact Info for Admin */}
                            {isDeveloper ? (
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 transition cursor-pointer ${
                                  copiedUid === u.uid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                                title="Copy Student Login Credentials"
                              >
                                {copiedUid === u.uid ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-500" />
                                    <span>Copy Pass</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const details = `Student: ${u.name || 'Anonymous'}\nEmail: ${u.email}\nMobile: ${u.mobile || 'N/A'}`;
                                  navigator.clipboard.writeText(details);
                                  setCopiedUid(u.uid);
                                  setTimeout(() => setCopiedUid(null), 2000);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 transition cursor-pointer ${
                                  copiedUid === u.uid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                                title="Copy Student Contact Information"
                              >
                                {copiedUid === u.uid ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied Info!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-500" />
                                    <span>Copy Info</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Elevate to Temp Admin/Dev (Lead Developer only) */}
                            {isDeveloper && (
                              <button
                                type="button"
                                onClick={() => {
                                  setElevateUser(u);
                                  setElevateRole('content_admin');
                                  setElevateIsTemp(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                                title="Elevate this student to Temporary Admin or Developer"
                              >
                                <Zap className="w-3 h-3 text-indigo-600" />
                                <span>Elevate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MOCK EXAM SUBMISSIONS ================= */}
      {activeTab === 'mockAttempts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xs">
              Complete Mock Examination Attempt Logs
            </h3>
            <span className="text-xs text-slate-500">{mockAttempts.length} Total Submissions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Mock Test Name</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Correct / Wrong</th>
                  <th className="px-5 py-3">Accuracy</th>
                  <th className="px-5 py-3">Time Spent</th>
                  <th className="px-5 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No mock test submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  mockAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{att.userName || 'Student'}</div>
                        <div className="text-[10px] text-slate-400">{att.userEmail}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{att.mockTitle}</td>
                      <td className="px-5 py-3.5 font-extrabold text-indigo-600">
                        {att.score} / {att.total}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono">
                        <span className="text-emerald-600 font-bold">{att.correct}✓</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-rose-600 font-bold">{att.wrong}✗</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            att.percentage >= 60
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {Math.round(att.percentage)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {Math.floor(att.timeTaken / 60)}m {att.timeTaken % 60}s
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(att.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: APPOINT PERMANENT OR TEMPORARY STAFF ================= */}
      {isAppointModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Appoint Staff Member or Temporary Access
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add permanent team or time-limited Temporary Admin / Developer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAppointModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {appointSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-slate-900 text-sm">Account Created Successfully!</h4>
                <p className="text-xs text-slate-500">
                  The credentials have been saved. If temporary, login will automatically expire when time is up.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAppointSubmit} className="space-y-3.5 text-xs">
                {/* Mode Switch: Permanent vs Temporary */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Access Duration Mode (समय सीमा प्रकार):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointIsTemporary(false)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        !appointIsTemporary
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div>Permanent Staff</div>
                        <div className="text-[10px] font-normal text-slate-500">No time limit</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppointIsTemporary(true)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        appointIsTemporary
                          ? 'border-amber-600 bg-amber-50/50 text-amber-950 font-bold'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <Timer className="w-4 h-4 text-amber-600" />
                      <div>
                        <div>Temporary Access ⏳</div>
                        <div className="text-[10px] font-normal text-slate-500">Expires automatically</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* If Temporary: Duration Controls */}
                {appointIsTemporary && (
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Set Temporary Access Expiration (समाप्ति समय)</span>
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '30 Mins', val: '30', unit: 'minutes' as const },
                        { label: '1 Hour', val: '1', unit: 'hours' as const },
                        { label: '6 Hours', val: '6', unit: 'hours' as const },
                        { label: '12 Hours', val: '12', unit: 'hours' as const },
                        { label: '24 Hours (1 Day)', val: '24', unit: 'hours' as const },
                        { label: '3 Days', val: '3', unit: 'days' as const },
                        { label: '7 Days', val: '7', unit: 'days' as const },
                        { label: '30 Days', val: '30', unit: 'days' as const },
                        { label: '3 Months', val: '3', unit: 'months' as const },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setAppointDurationVal(preset.val);
                            setAppointDurationUnit(preset.unit);
                            setAppointCustomDatetime('');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            !appointCustomDatetime &&
                            appointDurationVal === preset.val &&
                            appointDurationUnit === preset.unit
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Duration Inputs */}
                    <div className="pt-1.5 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                      <span className="text-slate-600 font-bold text-[11px]">Custom Duration (कस्टम समय):</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={appointDurationVal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setAppointDurationVal(val);
                          setAppointCustomDatetime('');
                        }}
                        placeholder="e.g. 15, 45, 90"
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-center font-bold bg-white text-xs"
                      />
                      <select
                        value={appointDurationUnit}
                        onChange={(e) => {
                          setAppointDurationUnit(e.target.value as any);
                          setAppointCustomDatetime('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white text-xs"
                      >
                        <option value="minutes">Minutes (मिनट)</option>
                        <option value="hours">Hours (घंटे)</option>
                        <option value="days">Days (दिन)</option>
                        <option value="months">Months (महीने)</option>
                      </select>
                    </div>

                    {/* Exact datetime picker */}
                    <div className="pt-1.5 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                      <span className="text-slate-600 font-semibold text-[11px]">Or exact date/time (निश्चित तिथि व समय):</span>
                      <input
                        type="datetime-local"
                        value={appointCustomDatetime}
                        onChange={(e) => setAppointCustomDatetime(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] bg-white"
                      />
                    </div>

                    {/* Live Preview */}
                    <div className="p-2.5 rounded-xl bg-white border border-amber-300/80 text-[11px] text-amber-900 font-medium space-y-0.5">
                      <div>
                        ⏳ <span className="font-bold">Expires:</span>{' '}
                        <span className="font-bold text-amber-950">
                          {appointCustomDatetime
                            ? formatReadableDate(fromLocalDatetimeInputValue(appointCustomDatetime))
                            : formatReadableDate(
                                calculateExpiryTimestamp(
                                  Math.max(1, parseInt(appointDurationVal) || 1),
                                  appointDurationUnit
                                )
                              )}
                        </span>
                      </div>
                      <div className="text-rose-700 text-[10px] font-semibold">
                        🔒 लॉगिन इसके बाद स्वतः बंद व ब्लॉक हो जाएगा।
                      </div>
                    </div>
                  </div>
                )}

                {/* Role to Assign */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Select Role to Assign:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointRole('content_admin')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        appointRole === 'content_admin' || appointRole === 'admin'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Academic Admin</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Upload lectures, PDFs, MCQs, mock tests.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppointRole('developer')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        appointRole === 'developer'
                          ? 'border-amber-600 bg-amber-50/50 text-amber-950 font-bold'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Partner Developer</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Master & remote developer console access.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={appointName}
                    onChange={(e) => setAppointName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email (लॉगिन ईमेल)</label>
                  <input
                    type="email"
                    required
                    value={appointEmail}
                    onChange={(e) => setAppointEmail(e.target.value)}
                    placeholder="ramesh@eduveda.in"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={appointMobile}
                    onChange={(e) => setAppointMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Login Password (पासवर्ड)</label>
                  <input
                    type="text"
                    required
                    value={appointPassword}
                    onChange={(e) => setAppointPassword(e.target.value)}
                    placeholder="e.g. Admin@2026!"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-indigo-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAppointModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={appointSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {appointSubmitting ? 'Creating & Authorizing...' : 'Create & Authorize Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EXTEND ACCESS MODAL ================= */}
      {extendModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Extend Temporary Access
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {extendModalUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExtendModalUser(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExtendAccessSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Additional Duration to Add:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '+30 Mins', val: '30', unit: 'minutes' as const },
                    { label: '+1 Hour', val: '1', unit: 'hours' as const },
                    { label: '+6 Hours', val: '6', unit: 'hours' as const },
                    { label: '+24 Hours', val: '24', unit: 'hours' as const },
                    { label: '+3 Days', val: '3', unit: 'days' as const },
                    { label: '+7 Days', val: '7', unit: 'days' as const },
                    { label: '+30 Days', val: '30', unit: 'days' as const },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setExtendVal(p.val);
                        setExtendUnit(p.unit);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        extendVal === p.val && extendUnit === p.unit
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={extendVal}
                  onChange={(e) => setExtendVal(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 15, 45, 90"
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-center bg-white"
                />
                <select
                  value={extendUnit}
                  onChange={(e) => setExtendUnit(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                >
                  <option value="minutes">Minutes (मिनट)</option>
                  <option value="hours">Hours (घंटे)</option>
                  <option value="days">Days (दिन)</option>
                  <option value="months">Months (महीने)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px]">
                New Expiry will be: <span className="font-bold">{formatReadableDate(calculateExpiryTimestamp(Math.max(1, parseInt(extendVal) || 1), extendUnit))}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendModalUser(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extendSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition shadow-xs disabled:opacity-50"
                >
                  {extendSubmitting ? 'Extending...' : 'Confirm Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: UNIVERSAL MANAGE ACCESS & EXPIRY (CONVERT PERMANENT <-> TEMPORARY) ================= */}
      {manageAccessUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Manage Access & Expiry (एक्सेस एवं वैधता प्रबंधन)
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                    {manageAccessUser.name || 'User'} ({manageAccessUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManageAccessUser(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManageAccess} className="space-y-4 text-xs">
              {/* Access Mode Switch */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Select Access Type (एक्सेस प्रकार चुनें):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setManageIsTemporary(false);
                      setManageCustomDatetime('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      !manageIsTemporary
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-extrabold">Permanent (स्थायी)</div>
                      <div className="text-[10px] font-normal text-slate-500">No expiration date</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManageIsTemporary(true)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      manageIsTemporary
                        ? 'border-amber-600 bg-amber-50/60 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Timer className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-extrabold">Temporary ⏳ (अस्थायी)</div>
                      <div className="text-[10px] font-normal text-slate-500">Auto-expires after time</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* If Temporary: Duration, Presets, Custom Number, Unit, Datetime-local */}
              {manageIsTemporary && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Set Expiry Duration (वैधता समय सीमा)</span>
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '30 Mins', val: '30', unit: 'minutes' as const },
                      { label: '1 Hour', val: '1', unit: 'hours' as const },
                      { label: '6 Hours', val: '6', unit: 'hours' as const },
                      { label: '12 Hours', val: '12', unit: 'hours' as const },
                      { label: '24 Hours (1 Day)', val: '24', unit: 'hours' as const },
                      { label: '3 Days', val: '3', unit: 'days' as const },
                      { label: '7 Days', val: '7', unit: 'days' as const },
                      { label: '30 Days (1 Month)', val: '30', unit: 'days' as const },
                      { label: '3 Months', val: '3', unit: 'months' as const },
                      { label: '1 Year', val: '1', unit: 'years' as const },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setManageDurationVal(preset.val);
                          setManageDurationUnit(preset.unit);
                          setManageCustomDatetime('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          !manageCustomDatetime &&
                          manageDurationVal === preset.val &&
                          manageDurationUnit === preset.unit
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Duration Input */}
                  <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                    <span className="text-slate-700 font-bold text-[11px]">Custom Duration (कस्टम समय):</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={manageDurationVal}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setManageDurationVal(val);
                        setManageCustomDatetime('');
                      }}
                      placeholder="e.g. 15, 45, 90"
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-center font-bold bg-white text-xs"
                    />
                    <select
                      value={manageDurationUnit}
                      onChange={(e) => {
                        setManageDurationUnit(e.target.value as any);
                        setManageCustomDatetime('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold bg-white text-xs"
                    >
                      <option value="minutes">Minutes (मिनट)</option>
                      <option value="hours">Hours (घंटे)</option>
                      <option value="days">Days (दिन)</option>
                      <option value="months">Months (महीने)</option>
                      <option value="years">Years (वर्ष)</option>
                    </select>
                  </div>

                  {/* Exact Date & Time Picker */}
                  <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                    <span className="text-slate-700 font-semibold text-[11px]">Or exact date/time (निश्चित तिथि व समय):</span>
                    <input
                      type="datetime-local"
                      value={manageCustomDatetime}
                      onChange={(e) => setManageCustomDatetime(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[11px] bg-white"
                    />
                  </div>

                  {/* Live Expiry Preview */}
                  <div className="p-2.5 rounded-xl bg-white border border-amber-300/80 text-[11px] text-amber-900 font-medium space-y-0.5">
                    <div>
                      ⏳ <span className="font-bold">New Expiry:</span>{' '}
                      <span className="font-bold text-amber-950">
                        {manageCustomDatetime
                          ? formatReadableDate(fromLocalDatetimeInputValue(manageCustomDatetime))
                          : formatReadableDate(
                              calculateExpiryTimestamp(
                                Math.max(1, parseInt(manageDurationVal) || 1),
                                manageDurationUnit
                              )
                            )}
                      </span>
                    </div>
                    <div className="text-rose-700 text-[10px] font-semibold">
                      🔒 समय समाप्त होने पर यूजर का एडमिन/स्टाफ लॉगिन तुरंत ब्लॉक हो जाएगा।
                    </div>
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Assign Role (भूमिका):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManageRole('content_admin')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      manageRole === 'content_admin' || manageRole === 'admin'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Academic Admin</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Lectures, PDFs, MCQs, mock tests.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManageRole('developer')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      manageRole === 'developer'
                        ? 'border-amber-600 bg-amber-50/60 text-amber-950 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Developer</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Full developer console & remote app tools.
                    </p>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManageAccessUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manageSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {manageSubmitting ? 'Saving Access...' : 'Save Access Settings (सहेजें)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ELEVATE STUDENT TO TEMP ADMIN / DEV ================= */}
      {elevateUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Elevate Student to Staff Role
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {elevateUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setElevateUser(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleElevateStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Elevated Role:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setElevateRole('content_admin')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                      elevateRole === 'content_admin'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Academic Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setElevateRole('developer')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                      elevateRole === 'developer'
                        ? 'border-amber-600 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Developer
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={elevateIsTemp}
                    onChange={(e) => setElevateIsTemp(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span>Temporary Access (समय सीमा के साथ)</span>
                </label>
              </div>

              {elevateIsTemp && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 block">Duration:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={elevateDurationVal}
                      onChange={(e) => setElevateDurationVal(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="24"
                      className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-bold text-center bg-white"
                    />
                    <select
                      value={elevateDurationUnit}
                      onChange={(e) => setElevateDurationUnit(e.target.value as any)}
                      className="px-2 py-1 rounded-lg border border-slate-300 font-bold bg-white"
                    >
                      <option value="minutes">Minutes (मिनट)</option>
                      <option value="hours">Hours (घंटे)</option>
                      <option value="days">Days (दिन)</option>
                      <option value="months">Months (महीने)</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-amber-800">
                    Expires: {formatReadableDate(calculateExpiryTimestamp(Math.max(1, parseInt(elevateDurationVal) || 1), elevateDurationUnit))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setElevateUser(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={elevateSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition shadow-xs disabled:opacity-50"
                >
                  {elevateSubmitting ? 'Elevating...' : 'Confirm Elevation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: EDIT PASSWORD MODAL ================= */}
      {isPasswordModalOpen && passwordEditUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Reset User Password
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                    {passwordEditUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-4 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-xs">Password Updated Successfully!</h4>
              </div>
            ) : (
              <form onSubmit={handleSaveNewPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Login Password</label>
                  <input
                    type="text"
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordUpdating}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {passwordUpdating ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Announcement & Temporary Access Expiration Helpers
 */
import type { AppSettings } from '../types';

export function isAnnouncementActive(settings?: AppSettings): boolean {
  if (!settings || !settings.showBanner || !settings.bannerNotice?.trim()) {
    return false;
  }

  if (!settings.announcementExpiresAt) {
    return true; // No expiration set => permanent banner
  }

  const expTime = new Date(settings.announcementExpiresAt).getTime();
  if (isNaN(expTime)) {
    return true;
  }

  return expTime > Date.now();
}

export function formatTimeRemaining(expiresAt?: string): {
  formatted: string;
  isExpired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  days: number;
} {
  if (!expiresAt) {
    return { formatted: 'Permanent (स्थायी)', isExpired: false, hours: 0, minutes: 0, seconds: 0, days: 0 };
  }

  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) {
    return { formatted: 'Permanent (स्थायी)', isExpired: false, hours: 0, minutes: 0, seconds: 0, days: 0 };
  }

  const diffMs = expTime - Date.now();
  if (diffMs <= 0) {
    return { formatted: 'Expired / समाप्त', isExpired: true, hours: 0, minutes: 0, seconds: 0, days: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return {
      formatted: `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
      isExpired: false,
      hours,
      minutes,
      seconds,
      days,
    };
  }

  return {
    formatted: `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`,
    isExpired: false,
    hours,
    minutes,
    seconds,
    days: 0,
  };
}

/**
 * Calculates future ISO timestamp from custom value and unit
 */
export function calculateExpiryTimestamp(
  value: number,
  unit: 'minutes' | 'hours' | 'days' | 'months' | 'years'
): string {
  const safeVal = Math.max(1, value);
  const now = Date.now();
  let msToAdd = safeVal * 60 * 1000;
  if (unit === 'hours') {
    msToAdd = safeVal * 60 * 60 * 1000;
  } else if (unit === 'days') {
    msToAdd = safeVal * 24 * 60 * 60 * 1000;
  } else if (unit === 'months') {
    msToAdd = safeVal * 30 * 24 * 60 * 60 * 1000;
  } else if (unit === 'years') {
    msToAdd = safeVal * 365 * 24 * 60 * 60 * 1000;
  }
  return new Date(now + msToAdd).toISOString();
}

/**
 * Convert ISO string to local input value for datetime-local
 */
export function toLocalDatetimeInputValue(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert local datetime-local string to ISO string
 */
export function fromLocalDatetimeInputValue(localStr: string): string {
  if (!localStr) return '';
  const d = new Date(localStr);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Format readable date for temporary accounts / notices
 */
export function formatReadableDate(isoString?: string): string {
  if (!isoString) return 'Permanent (स्थायी)';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

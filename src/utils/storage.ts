import type { ServiceRequest, SystemSettings } from '../types';
import type { User, StoredAdmin } from '../types/auth';
import { DEFAULT_SETTINGS, SEED_ADMINS, createSampleRequests } from '../data/defaults';

const KEYS = {
  USER: 'auth_user',
  REQUESTS: 'serviceRequests',
  SETTINGS: 'systemSettings',
  // v2: fresh key so all installs (even with stale/corrupt data) get the full seed
  ADMINS: 'portal_admins_v2',
  INIT: 'portal_initialized_v2',
} as const;

/** Parse a JSON localStorage value safely; returns null on missing/invalid/non-array */
function readJsonArray<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function readAdmins(): StoredAdmin[] | null {
  return readJsonArray<StoredAdmin>(KEYS.ADMINS);
}

export function ensureInitialized(): void {
  // Admins: seed for fresh installs, re-seed when empty/corrupt, and
  // merge newly seeded admins (by username) into existing installs.
  const existingAdmins = readAdmins();
  if (!existingAdmins || existingAdmins.length === 0) {
    localStorage.setItem(KEYS.ADMINS, JSON.stringify(SEED_ADMINS));
  } else {
    const missing = SEED_ADMINS.filter(
      (s) => !existingAdmins.some((a) => a.username === s.username)
    );
    if (missing.length) {
      localStorage.setItem(KEYS.ADMINS, JSON.stringify([...existingAdmins, ...missing]));
    }
  }

  // Settings: merge missing default services (by key) so newly added
  // services appear for existing installs too.
  const storedSettings = localStorage.getItem(KEYS.SETTINGS);
  if (!storedSettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  } else {
    const existing = JSON.parse(storedSettings) as SystemSettings;
    const existingServices = existing.services?.length ? existing.services : [];
    const missingServices = DEFAULT_SETTINGS.services.filter(
      (ds) => !existingServices.some((s) => s.key === ds.key)
    );
    const merged: SystemSettings = {
      services: [...existingServices, ...missingServices],
      colleges: existing.colleges?.length ? existing.colleges : DEFAULT_SETTINGS.colleges,
      externalEntities: existing.externalEntities?.length
        ? existing.externalEntities
        : DEFAULT_SETTINGS.externalEntities,
      general: existing.general || DEFAULT_SETTINGS.general,
    };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  }

  if (localStorage.getItem(KEYS.INIT)) return;

  const existingReqs = localStorage.getItem(KEYS.REQUESTS);
  if (!existingReqs || existingReqs === '[]') {
    localStorage.setItem(KEYS.REQUESTS, JSON.stringify(createSampleRequests()));
  }

  localStorage.setItem(KEYS.INIT, '1');
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.USER);
  }
}

export function getStoredRequests(): ServiceRequest[] {
  ensureInitialized();
  const data = localStorage.getItem(KEYS.REQUESTS);
  return data ? JSON.parse(data) : [];
}

export function setStoredRequests(requests: ServiceRequest[]): void {
  localStorage.setItem(KEYS.REQUESTS, JSON.stringify(requests));
}

export function addStoredRequest(request: ServiceRequest): void {
  const requests = getStoredRequests();
  requests.unshift(request);
  setStoredRequests(requests);
}

export function updateStoredRequest(id: string, patch: Partial<ServiceRequest>): ServiceRequest | null {
  const requests = getStoredRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], ...patch };
  setStoredRequests(requests);
  return requests[idx];
}

export function getRequestByTracking(code: string): ServiceRequest | null {
  const requests = getStoredRequests();
  return requests.find((r) => r.trackingCode?.toUpperCase() === code.toUpperCase()) || null;
}

export function getSystemSettings(): SystemSettings {
  ensureInitialized();
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function saveSystemSettings(settings: SystemSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

/* ================= Admins ================= */

export function getStoredAdmins(): StoredAdmin[] {
  ensureInitialized();
  const data = localStorage.getItem(KEYS.ADMINS);
  return data ? JSON.parse(data) : [];
}

export function saveStoredAdmins(admins: StoredAdmin[]): void {
  localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
}

export function addStoredAdmin(admin: StoredAdmin): void {
  const admins = getStoredAdmins();
  admins.unshift(admin);
  saveStoredAdmins(admins);
}

export function updateStoredAdmin(id: string, patch: Partial<StoredAdmin>): StoredAdmin | null {
  const admins = getStoredAdmins();
  const idx = admins.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  admins[idx] = { ...admins[idx], ...patch };
  saveStoredAdmins(admins);
  return admins[idx];
}

export function deleteStoredAdmin(id: string): void {
  saveStoredAdmins(getStoredAdmins().filter((a) => a.id !== id));
}

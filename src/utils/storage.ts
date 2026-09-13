import type { RequestMessage, ServiceRequest, SystemSettings, VenueInfo } from '../types';
import type { User, StoredAdmin } from '../types/auth';
import { DEFAULT_SETTINGS, SEED_ADMINS, DEFAULT_VENUES, createSampleRequests } from '../data/defaults';
import { syncApi } from './api';

const KEYS = {
  USER: 'auth_user',
  REQUESTS: 'serviceRequests',
  SETTINGS: 'systemSettings',
  // v2: fresh key so all installs (even with stale/corrupt data) get the full seed
  ADMINS: 'portal_admins_v2',
  VENUES: 'portal_venues_v2',
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
    // Migration: sync seed-defined role/department for existing accounts and
    // assign seed services when the stored account has none configured yet.
    const synced = existingAdmins.map((a) => {
      const seed = SEED_ADMINS.find((s) => s.username === a.username);
      if (!seed) return a;
      return {
        ...a,
        role: seed.role,
        department: seed.department ?? a.department,
        services: a.services?.length ? a.services : seed.services,
      };
    });
    if (missing.length || JSON.stringify(synced) !== JSON.stringify(existingAdmins)) {
      localStorage.setItem(KEYS.ADMINS, JSON.stringify([...synced, ...missing]));
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

  // Venues: initialize or sync new default venues
  const storedVenues = localStorage.getItem(KEYS.VENUES);
  if (!storedVenues) {
    localStorage.setItem(KEYS.VENUES, JSON.stringify(DEFAULT_VENUES));
  } else {
    try {
      const existingVenues = JSON.parse(storedVenues) as VenueInfo[];
      const missingVenues = DEFAULT_VENUES.filter(
        (dv) => !existingVenues.some((v) => v.id === dv.id)
      );
      if (missingVenues.length > 0) {
        localStorage.setItem(
          KEYS.VENUES,
          JSON.stringify([...existingVenues, ...missingVenues])
        );
      }
    } catch {
      localStorage.setItem(KEYS.VENUES, JSON.stringify(DEFAULT_VENUES));
    }
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
  syncApi.addRequest(request);
}

export function updateStoredRequest(id: string, patch: Partial<ServiceRequest>): ServiceRequest | null {
  const requests = getStoredRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], ...patch };
  setStoredRequests(requests);
  syncApi.updateRequest(id, patch);
  return requests[idx];
}

export function getRequestByTracking(code: string): ServiceRequest | null {
  const requests = getStoredRequests();
  return requests.find((r) => r.trackingCode?.toUpperCase() === code.toUpperCase()) || null;
}

/* ================= Internal messages ================= */

export function sendRequestMessage(
  requestId: string,
  from: RequestMessage['from'],
  senderName: string,
  text: string
): void {
  const req = getStoredRequests().find((r) => r.id === requestId);
  if (!req || !text.trim()) return;
  const msg: RequestMessage = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    from,
    senderName,
    text: text.trim(),
    at: new Date().toISOString(),
    readByManager: from === 'manager' || from === 'system',
    readByRequester: from === 'requester',
  };
  updateStoredRequest(requestId, { messages: [...(req.messages || []), msg] });
}

export function markRequestMessagesRead(
  requestId: string,
  reader: 'manager' | 'requester'
): void {
  const req = getStoredRequests().find((r) => r.id === requestId);
  if (!req?.messages?.length) return;
  const flag = reader === 'manager' ? 'readByManager' : 'readByRequester';
  if (req.messages.every((m) => m[flag])) return;
  updateStoredRequest(requestId, {
    messages: req.messages.map((m) => ({ ...m, [flag]: true })),
  });
}

export function countUnreadMessages(
  requests: ServiceRequest[],
  reader: 'manager' | 'requester'
): number {
  if (reader === 'manager') {
    return requests.reduce(
      (n, r) => n + (r.messages || []).filter((m) => m.from === 'requester' && !m.readByManager).length,
      0
    );
  }
  // مقدم الطلب: تنبيه عند رسائل الإدارة ورسائل النظام (اعتماد/إعادة جدولة)
  return requests.reduce(
    (n, r) => n + (r.messages || []).filter((m) => m.from !== 'requester' && !m.readByRequester).length,
    0
  );
}

export function getSystemSettings(): SystemSettings {
  ensureInitialized();
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function saveSystemSettings(settings: SystemSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  syncApi.saveSettings(settings);
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
  syncApi.addAdmin(admin);
}

export function updateStoredAdmin(id: string, patch: Partial<StoredAdmin>): StoredAdmin | null {
  const admins = getStoredAdmins();
  const idx = admins.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  admins[idx] = { ...admins[idx], ...patch };
  saveStoredAdmins(admins);
  syncApi.updateAdmin(id, patch);
  return admins[idx];
}

export function deleteStoredAdmin(id: string): void {
  saveStoredAdmins(getStoredAdmins().filter((a) => a.id !== id));
  syncApi.deleteAdmin(id);
}

/* ================= Venues ================= */

export function getStoredVenues(): VenueInfo[] {
  ensureInitialized();
  const raw = localStorage.getItem(KEYS.VENUES);
  if (!raw) {
    localStorage.setItem(KEYS.VENUES, JSON.stringify(DEFAULT_VENUES));
    return DEFAULT_VENUES;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_VENUES;
  } catch {
    return DEFAULT_VENUES;
  }
}

export function saveStoredVenues(venues: VenueInfo[]): void {
  localStorage.setItem(KEYS.VENUES, JSON.stringify(venues));
}

export function updateStoredVenue(id: string, patch: Partial<VenueInfo>): VenueInfo | null {
  const venues = getStoredVenues();
  const idx = venues.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  venues[idx] = { ...venues[idx], ...patch };
  saveStoredVenues(venues);
  syncApi.updateVenue(id, patch);
  return venues[idx];
}

export function addStoredVenue(venue: VenueInfo): void {
  const venues = getStoredVenues();
  venues.push(venue);
  saveStoredVenues(venues);
  syncApi.addVenue(venue);
}

export function deleteStoredVenue(id: string): void {
  saveStoredVenues(getStoredVenues().filter((v) => v.id !== id));
  syncApi.deleteVenue(id);
}

export function resetStoredVenues(): void {
  saveStoredVenues(DEFAULT_VENUES);
}

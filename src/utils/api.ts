import type { ServiceRequest, SystemSettings, VenueInfo } from '../types';
import type { StoredAdmin, User } from '../types/auth';
import { DEFAULT_SETTINGS, DEFAULT_VENUES, SEED_ADMINS, createSampleRequests } from '../data/defaults';

// In dev the API runs on :3001; in production the same service serves both
// the frontend and /api, so we default to same-origin relative paths.
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

let apiUp: boolean | null = null;

async function apiFetch(path: string, init?: RequestInit, timeoutMs = 4000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

/** هل خادم الـ API متاح؟ (يُخزَّن الناتج مؤقتاً لجلسة التشغيل) */
export async function isApiAvailable(): Promise<boolean> {
  if (apiUp !== null) return apiUp;
  try {
    const res = await apiFetch('/api/health', undefined, 2500);
    apiUp = res.ok;
  } catch {
    apiUp = false;
  }
  return apiUp;
}

/** تسجيل الدخول عبر الخادم — يعيد null إذا تعذر الاتصال أو فشلت البيانات */
export async function apiLogin(username: string, password: string): Promise<User | null> {
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

const KEYS = {
  REQUESTS: 'serviceRequests',
  SETTINGS: 'systemSettings',
  ADMINS: 'portal_admins_v2',
  VENUES: 'portal_venues_v2',
} as const;

/**
 * تحميل بيانات قاعدة البيانات إلى الكاش المحلي قبل عرض الواجهة.
 * إذا كانت القاعدة فارغة تتم زراعتها بالبيانات الافتراضية.
 */
export async function hydrateFromServer(): Promise<boolean> {
  if (!(await isApiAvailable())) return false;
  try {
    const state = await (await apiFetch('/api/bootstrap-state')).json();
    if (state.empty) {
      await apiFetch('/api/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          admins: SEED_ADMINS,
          venues: DEFAULT_VENUES,
          requests: createSampleRequests(),
          settings: DEFAULT_SETTINGS,
        }),
      });
    }
    const [reqs, venues, admins, settings] = await Promise.all([
      apiFetch('/api/requests').then((r) => r.json()),
      apiFetch('/api/venues').then((r) => r.json()),
      apiFetch('/api/admins').then((r) => r.json()),
      apiFetch('/api/settings').then((r) => r.json()),
    ]);
    if (Array.isArray(reqs)) localStorage.setItem(KEYS.REQUESTS, JSON.stringify(reqs));
    if (Array.isArray(venues) && venues.length) localStorage.setItem(KEYS.VENUES, JSON.stringify(venues));
    if (Array.isArray(admins) && admins.length) localStorage.setItem(KEYS.ADMINS, JSON.stringify(admins));
    if (settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    console.info('[api] hydrated from PostgreSQL server');
    return true;
  } catch (e) {
    console.warn('[api] hydration failed, using localStorage fallback', e);
    apiUp = false;
    return false;
  }
}

/* ---------- write-through sync (fire-and-forget) ---------- */

function push(method: string, path: string, body?: unknown): void {
  if (apiUp === false) return;
  apiFetch(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }).catch(() => {
    apiUp = false;
  });
}

export const syncApi = {
  addRequest: (r: ServiceRequest) => push('POST', '/api/requests', r),
  updateRequest: (id: string, patch: Partial<ServiceRequest>) =>
    push('PATCH', `/api/requests/${id}`, patch),
  saveSettings: (s: SystemSettings) => push('PUT', '/api/settings', s),
  addAdmin: (a: StoredAdmin) => push('POST', '/api/admins', a),
  updateAdmin: (id: string, patch: Partial<StoredAdmin>) => push('PATCH', `/api/admins/${id}`, patch),
  deleteAdmin: (id: string) => push('DELETE', `/api/admins/${id}`),
  addVenue: (v: VenueInfo) => push('POST', '/api/venues', v),
  updateVenue: (id: string, patch: Partial<VenueInfo>) => push('PATCH', `/api/venues/${id}`, patch),
  deleteVenue: (id: string) => push('DELETE', `/api/venues/${id}`),
  saveVenues: (venues: VenueInfo[]) => venues.forEach((v) => push('POST', '/api/venues', v)),
};

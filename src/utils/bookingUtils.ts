import type { ServiceRequest, DateRange, VenueInfo } from '../types';
import { addDaysISO, normalizeDateRange } from './dateUtils';

const ACTIVE_STATUSES = ['pending', 'approved', 'in_progress'] as const;

/** طلب مرتبط بمركز الدرعية/المرافق: خدمة حجز المرافق أو أي طلب يتضمن قاعات */
export function isCenterRequest(r: ServiceRequest): boolean {
  return (
    r.serviceType === 'theater' ||
    (r.venues?.length ?? 0) > 0 ||
    r.needsVenueBooking === true
  );
}

/** هل الطلب نشط ويشغل وقتاً في الجدول؟ */
export function isActiveBooking(r: ServiceRequest): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(r.status);
}

/** تداخل فترتين زمنيتين "HH:MM" */
export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const priorityWeight = { urgent: 3, high: 2, normal: 1 } as const;

export function priorityOf(r: ServiceRequest): number {
  return priorityWeight[r.priority ?? 'normal'] ?? 1;
}

/**
 * الحجوزات المتعارضة مع طلب معيّن: نفس القاعة + نفس التاريخ + تداخل في الوقت.
 * يعيد قائمة الطلبات الأخرى المتعارضة.
 */
export function findRequestConflicts(req: ServiceRequest, all: ServiceRequest[]): ServiceRequest[] {
  if (!req.venues?.length || !req.eventDates?.length || !isActiveBooking(req)) return [];
  return all.filter((other) => {
    if (other.id === req.id || !isActiveBooking(other)) return false;
    if (!other.venues?.some((v) => req.venues!.includes(v))) return false;
    for (const rawA of req.eventDates) {
      const a = normalizeDateRange(rawA);
      if (!a.date) continue;
      for (const rawB of other.eventDates) {
        const b = normalizeDateRange(rawB);
        if (b.date !== a.date) continue;
        if (timesOverlap(a.startTime || '00:00', a.endTime || '23:59', b.startTime || '00:00', b.endTime || '23:59')) {
          return true;
        }
      }
    }
    return false;
  });
}

/** خريطة: requestId -> قائمة الطلبات المتعارضة معه */
export function buildConflictsMap(requests: ServiceRequest[]): Map<string, ServiceRequest[]> {
  const map = new Map<string, ServiceRequest[]>();
  const active = requests.filter((r) => isActiveBooking(r) && r.venues?.length && r.eventDates?.length);
  for (const r of active) {
    const conflicts = findRequestConflicts(r, active);
    if (conflicts.length) map.set(r.id, conflicts);
  }
  return map;
}

/** عدد الحجوزات المتعارضة لقاعة في تاريخ معيّن */
export function slotConflicts(reqs: ServiceRequest[]): boolean {
  if (reqs.length < 2) return false;
  for (let i = 0; i < reqs.length; i++) {
    for (let j = i + 1; j < reqs.length; j++) {
      const a = reqs[i], b = reqs[j];
      for (const ra of a.eventDates) {
        for (const rb of b.eventDates) {
          const da = normalizeDateRange(ra), db = normalizeDateRange(rb);
          if (da.date === db.date && timesOverlap(da.startTime, da.endTime, db.startTime, db.endTime)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/** ترتيب الطلبات: العاجلة أولاً ثم العالية ثم العادية، وداخلها الأحدث أولاً */
export function sortByPriority<T extends ServiceRequest>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const p = priorityOf(b) - priorityOf(a);
    if (p !== 0) return p;
    return (b.requestDate || '').localeCompare(a.requestDate || '');
  });
}

/** كل حجوزات قاعة في تاريخ محدد */
export function bookingsForSlot(
  requests: ServiceRequest[],
  venueId: string,
  date: string
): ServiceRequest[] {
  return requests.filter((r) => {
    if (!isActiveBooking(r) || !r.venues?.includes(venueId)) return false;
    return r.eventDates.some((raw) => normalizeDateRange(raw).date === date);
  });
}

/* ---------- ضوابط الحجز (Booking Rules) ---------- */

export interface BookingRuleViolation {
  code: 'past_date' | 'beyond_window' | 'consecutive_days';
  /** أيام الفترة المتصلة عند مخالفة الحد الأقصى */
  runLength?: number;
  limit?: number;
}

/** أطول سلسلة أيام متصلة ضمن المواعيد المحددة */
export function longestConsecutiveRun(dates: string[]): number {
  const uniq = [...new Set(dates.filter(Boolean))].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of uniq) {
    if (prev) {
      const diff = Math.round(
        (new Date(d + 'T00:00:00').getTime() - new Date(prev + 'T00:00:00').getTime()) / 86400000
      );
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/**
 * فحص مواعيد الطلب ضد ضوابط المركز:
 * - لا مواعيد في الماضي
 * - لا مواعيد تتجاوز نافذة maxAdvanceDays
 * - لا حجز يتجاوز maxConsecutiveDays أيام متصلة
 */
export function validateBookingDates(
  slots: DateRange[],
  cfg: { maxAdvanceDays: number; maxConsecutiveDays: number },
  today: string
): BookingRuleViolation | null {
  const limit = addDaysISO(cfg.maxAdvanceDays, today);
  for (const raw of slots) {
    const d = normalizeDateRange(raw).date;
    if (!d) continue;
    if (d < today) return { code: 'past_date' };
    if (d > limit) return { code: 'beyond_window', limit: cfg.maxAdvanceDays };
  }
  const run = longestConsecutiveRun(slots.map((s) => normalizeDateRange(s).date));
  if (cfg.maxConsecutiveDays > 0 && run > cfg.maxConsecutiveDays) {
    return { code: 'consecutive_days', runLength: run, limit: cfg.maxConsecutiveDays };
  }
  return null;
}

export type { DateRange, VenueInfo };

import type { DateRange } from '../types';

export function formatDate(dateStr: string, language: string = 'ar'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'م' : 'ص';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

/** Legacy eventDates shape that used startDate instead of date */
type LegacyDateRange = Partial<DateRange> & { startDate?: string };

export function formatDateRange(dates: DateRange[], language: string = 'ar'): string {
  if (!dates?.length) return '—';
  return dates
    .map((d) => {
      const day = formatDate(d.date || (d as LegacyDateRange).startDate || '', language);
      if (d.startTime && d.endTime) {
        return `${day} (${formatTime(d.startTime)} - ${formatTime(d.endTime)})`;
      }
      return day;
    })
    .join(' · ');
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysISO(days: number, from?: string): string {
  const d = from ? new Date(from + 'T00:00:00') : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** Normalize legacy eventDates that used startDate/endDate */
export function normalizeDateRange(dr: LegacyDateRange): DateRange {
  if (dr.date) {
    return {
      date: dr.date,
      startTime: dr.startTime || '00:00',
      endTime: dr.endTime || '23:59',
    };
  }
  return {
    date: dr.startDate || '',
    startTime: dr.startTime || '00:00',
    endTime: dr.endTime || '23:59',
  };
}

export function rangesOverlap(
  a: { date: string; startTime: string; endTime: string },
  b: { date: string; startTime: string; endTime: string }
): boolean {
  if (a.date !== b.date) return false;
  return !(a.endTime <= b.startTime || a.startTime >= b.endTime);
}

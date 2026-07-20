import { useMemo } from 'react';
import type { ServiceRequest, VenueType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { addDaysISO, normalizeDateRange, todayISO } from '../utils/dateUtils';
import { DEFAULT_VENUES } from '../data/defaults';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  requests: ServiceRequest[];
  selectedVenues?: VenueType[];
}

export default function VenueAvailabilityPopup({
  open,
  onClose,
  requests,
  selectedVenues = [],
}: Props) {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const days = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 14 }, (_, i) => addDaysISO(i, start));
  }, []);

  const venues = (
    selectedVenues.length
      ? DEFAULT_VENUES.filter((v) => selectedVenues.includes(v.id))
      : DEFAULT_VENUES
  );

  const booked = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const v of DEFAULT_VENUES) map[v.id] = new Set();
    for (const req of requests) {
      if (!req.venues?.length) continue;
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      for (const v of req.venues) {
        for (const raw of req.eventDates || []) {
          const dr = normalizeDateRange(raw);
          if (dr.date) map[v]?.add(dr.date);
        }
      }
    }
    return map;
  }, [requests]);

  const formatDay = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={t('form.venues.availability_title')} size="xl">
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3 font-bold text-slate-600 min-w-[110px]">—</th>
              {days.map((d) => (
                <th key={d} className="p-2 font-medium text-slate-500 whitespace-nowrap">
                  {formatDay(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold text-slate-800">
                  {isAr ? venue.nameAr : venue.nameEn}
                </td>
                {days.map((d) => {
                  const isBooked = booked[venue.id]?.has(d);
                  return (
                    <td key={d} className="p-1.5 text-center">
                      <span
                        className={`inline-block w-full py-1.5 rounded-lg text-[11px] font-semibold ${
                          isBooked
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isBooked ? t('venues.booked') : t('venues.available')}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">{t('form.venues.table_hint')}</p>
    </Modal>
  );
}

import { useMemo, useState } from 'react';
import type { ServiceRequest, VenueType, VenueInfo } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { addDaysISO, normalizeDateRange, todayISO } from '../utils/dateUtils';
import { getStoredVenues } from '../utils/storage';
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
  const [venues] = useState<VenueInfo[]>(() => getStoredVenues());

  const days = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 14 }, (_, i) => addDaysISO(i, start));
  }, []);

  const displayedVenues = useMemo(() => {
    if (selectedVenues.length > 0) {
      return venues.filter((v) => selectedVenues.includes(v.id));
    }
    return venues;
  }, [venues, selectedVenues]);

  const booked = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const v of venues) map[v.id] = new Set();
    map['b2'] = map['b2'] || new Set();

    for (const req of requests) {
      if (!req.venues?.length) continue;
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      for (const v of req.venues) {
        if (!map[v]) map[v] = new Set();
        for (const raw of req.eventDates || []) {
          const dr = normalizeDateRange(raw);
          if (dr.date) map[v]?.add(dr.date);
        }
      }
    }
    return map;
  }, [venues, requests]);

  const formatDay = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return {
      weekday: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { weekday: 'short' }),
      day: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'numeric' }),
    };
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={t('form.venues.availability_title')} size="xl">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-bold text-slate-700 min-w-[160px] sticky start-0 bg-slate-50 border-e border-slate-200">
                {isAr ? 'المرفق' : 'Facility'}
              </th>
              {days.map((d) => {
                const info = formatDay(d);
                return (
                  <th key={d} className="p-2 font-medium text-slate-600 whitespace-nowrap text-center">
                    <div className="text-[10px] text-slate-400 uppercase">{info.weekday}</div>
                    <div className="font-bold">{info.day}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedVenues.map((venue) => (
              <tr key={venue.id} className="hover:bg-slate-50/70">
                <td className="p-2.5 font-semibold text-slate-800 sticky start-0 bg-white border-e border-slate-200">
                  <div className="font-bold text-xs">{isAr ? venue.nameAr : venue.nameEn}</div>
                  <div className="text-[10px] text-slate-400">{venue.capacity} {t('venues.persons')}</div>
                </td>
                {days.map((d) => {
                  const isBooked = booked[venue.id]?.has(d);
                  return (
                    <td key={d} className="p-1 text-center">
                      <span
                        className={`inline-block w-full py-1.5 px-1 rounded-md text-[10px] font-bold ${
                          isBooked
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 font-naskh">
        <span>{t('form.venues.table_hint')}</span>
        <span className="text-emerald-700 font-medium">{isAr ? 'الأخضر = متاح · الأحمر = محجوز' : 'Green = Available · Red = Booked'}</span>
      </div>
    </Modal>
  );
}

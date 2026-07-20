import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Check, CalendarDays } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_VENUES } from '../data/defaults';
import { getStoredRequests } from '../utils/storage';
import { addDaysISO, normalizeDateRange, todayISO } from '../utils/dateUtils';
import type { VenueType, ServiceRequest } from '../types';

const VENUE_IMAGES: Record<VenueType, string> = {
  theater: '/img/business-presentation.jpg',
  lobby: '/img/campus-1.jpg',
  b2: '/img/business-meeting.jpg',
};

export default function VenuesPage() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const [requests] = useState<ServiceRequest[]>(() => getStoredRequests());

  const days = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 14 }, (_, i) => addDaysISO(i, start));
  }, []);

  const booked = useMemo(() => {
    const map: Record<VenueType, Set<string>> = {
      theater: new Set(),
      lobby: new Set(),
      b2: new Set(),
    };
    for (const req of requests) {
      if (!req.venues?.length || !req.eventDates?.length) continue;
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      for (const v of req.venues) {
        for (const raw of req.eventDates) {
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
    <div className="page-shell animate-fadeIn">
      <div className="mb-10">
        <div className="title-rule">
          <h1 className="section-title !mb-0">{t('venues.title')}</h1>
        </div>
        <p className="section-subtitle max-w-2xl">{t('venues.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {DEFAULT_VENUES.map((venue) => (
          <div key={venue.id} className="card flex flex-col !p-0 overflow-hidden">
            <div className="h-36 relative overflow-hidden">
              <img
                src={VENUE_IMAGES[venue.id]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(11,44,53,0.9) 0%, rgba(11,44,53,0.25) 100%)',
                }}
              />
              <div className="absolute top-0 start-0 w-10 h-10 border-s border-t border-secondary/40" />
              <div className="absolute bottom-3 start-4 end-4 flex items-end justify-between">
                <h3 className="text-white text-lg font-semibold">
                  {isAr ? venue.nameAr : venue.nameEn}
                </h3>
                <span className="text-secondary-300 text-xs border border-secondary/40 px-2 py-1 bg-ink/40">
                  {venue.capacity} {t('venues.persons')}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                {venue.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Users className="w-4 h-4 text-secondary" />
                {t('venues.capacity')}: {venue.capacity}
              </div>
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-400 mb-2">{t('venues.amenities')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {venue.amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg"
                    >
                      <Check className="w-3 h-3" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                to={`/services?service=theater&venue=${venue.id}`}
                className="btn-primary mt-auto w-full"
              >
                {t('venues.book')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Availability table */}
      <div className="card-static">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-primary-900">{t('venues.availability')}</h2>
          </div>
          <div className="text-xs text-slate-500">{t('venues.legend')} · {t('venues.next14')}</div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 font-bold text-slate-600 sticky start-0 bg-slate-50 min-w-[120px]">
                  {t('venues.title')}
                </th>
                {days.map((d) => (
                  <th key={d} className="p-2 font-medium text-slate-500 whitespace-nowrap min-w-[72px]">
                    {formatDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEFAULT_VENUES.map((venue) => (
                <tr key={venue.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-slate-800 sticky start-0 bg-white">
                    {isAr ? venue.nameAr : venue.nameEn}
                  </td>
                  {days.map((d) => {
                    const isBooked = booked[venue.id]?.has(d);
                    return (
                      <td key={d} className="p-1.5 text-center">
                        <span
                          className={`inline-block w-full py-1.5 rounded-lg text-[11px] font-semibold ${
                            isBooked
                              ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                              : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
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
      </div>
    </div>
  );
}

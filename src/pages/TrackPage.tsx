import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, PackageSearch, Clock, User, Mail, Building2, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getRequestByTracking, getSystemSettings } from '../utils/storage';
import { formatDateRange, formatDate } from '../utils/dateUtils';
import StatusBadge from '../components/StatusBadge';
import type { ServiceRequest } from '../types';

export default function TrackPage() {
  const { t, language } = useLanguage();
  const [params] = useSearchParams();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ServiceRequest | null | undefined>(undefined);
  const [searched, setSearched] = useState(false);

  const runSearch = (q: string) => {
    const query = q.trim();
    if (!query) return;
    setCode(query.toUpperCase());
    setResult(getRequestByTracking(query));
    setSearched(true);
  };

  useEffect(() => {
    const q = params.get('code');
    if (q) runSearch(q);
  }, [params]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(code);
  };

  const serviceName = (key: string) => {
    const s = getSystemSettings().services.find((x) => x.key === key);
    if (!s) return t(`service.${key}`) !== `service.${key}` ? t(`service.${key}`) : key;
    return language === 'ar' ? s.name : s.nameEn || s.name;
  };

  return (
    <div className="page-shell animate-fadeIn">
      <div className="max-w-2xl mx-auto mb-8">
        <div className="title-rule justify-center sm:justify-start">
          <div className="w-12 h-12 border border-primary flex items-center justify-center text-primary me-1">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h1 className="section-title !mb-0">{t('track.title')}</h1>
        </div>
        <p className="section-subtitle mt-2">{t('track.subtitle')}</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
        <div className="card-static flex flex-col sm:flex-row gap-3 !p-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('track.placeholder')}
            className="input-field flex-1 font-mono tracking-wider text-center sm:text-start"
            dir="ltr"
          />
          <button type="submit" className="btn-primary px-6">
            <Search className="w-4 h-4" />
            {t('track.button')}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">{t('track.hint')}</p>
      </form>

      {searched && result === null && (
        <div className="max-w-xl mx-auto card-static text-center text-rose-600 bg-rose-50 border-rose-100">
          {t('track.notFound')}
        </div>
      )}

      {result && (
        <div className="max-w-3xl mx-auto space-y-5 animate-slideUp">
          <div className="card-static">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">{t('form.success.tracking')}</div>
                <div className="font-mono text-xl font-bold text-primary-800 tracking-wide" dir="ltr">
                  {result.trackingCode}
                </div>
              </div>
              <div className="text-start sm:text-end">
                <div className="text-xs text-slate-400 mb-1">{t('track.status')}</div>
                <StatusBadge status={result.status} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{result.title}</h2>
            <p className="text-sm text-slate-500 mb-4">{result.description}</p>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info icon={<Building2 className="w-4 h-4" />} label={t('table.serviceType')} value={serviceName(result.serviceType)} />
              <Info icon={<Calendar className="w-4 h-4" />} label={t('table.dates')} value={formatDateRange(result.eventDates, language)} />
              <Info icon={<User className="w-4 h-4" />} label={t('form.name')} value={result.requesterName} />
              <Info icon={<Mail className="w-4 h-4" />} label={t('form.email')} value={result.requesterEmail} />
              {result.venues?.length ? (
                <Info
                  icon={<Building2 className="w-4 h-4" />}
                  label={t('request.details.venues')}
                  value={result.venues.map((v) => t(`venues.${v}`)).join(' · ')}
                />
              ) : null}
              <Info
                icon={<Clock className="w-4 h-4" />}
                label={t('table.date')}
                value={formatDate(result.requestDate, language)}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="card-static">
            <h3 className="font-bold text-primary-900 mb-4">{t('track.timeline')}</h3>
            <div className="relative space-y-0">
              {(result.statusHistory || []).map((h, i, arr) => (
                <div key={i} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                        i === arr.length - 1 ? 'bg-primary' : 'bg-secondary'
                      }`}
                    />
                    {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                  </div>
                  <div className="-mt-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge status={h.status} />
                      <span className="text-xs text-slate-400">
                        {formatDate(h.changedAt.split('T')[0], language)}{' '}
                        {h.changedAt.includes('T')
                          ? new Date(h.changedAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {h.changedBy}
                      {h.note ? ` — ${h.note}` : ''}
                    </div>
                  </div>
                </div>
              ))}
              {(!result.statusHistory || result.statusHistory.length === 0) && (
                <p className="text-sm text-slate-400">—</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400 font-medium">{label}</div>
        <div className="text-slate-700 font-medium break-words">{value || '—'}</div>
      </div>
    </div>
  );
}

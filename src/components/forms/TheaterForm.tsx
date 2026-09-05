import { useState } from 'react';
import { CalendarDays, Check, Building2 } from 'lucide-react';
import type { ServiceFormData, VenueType, ServiceRequest, DateRange, VenueInfo, VenueEventType } from '../../types';
import VenueAvailabilityPopup from '../VenueAvailabilityPopup';
import { useLanguage } from '../../context/LanguageContext';
import { getStoredVenues } from '../../utils/storage';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
  allRequests: ServiceRequest[];
  showAvailability: boolean;
  setShowAvailability: (show: boolean) => void;
}

const EVENT_TYPES: VenueEventType[] = [
  'exam',
  'workshop',
  'lecture',
  'conference',
  'ceremony',
  'exhibition',
  'meeting',
  'other',
];

export default function TheaterForm({
  formData,
  setFormData,
  allRequests,
  showAvailability,
  setShowAvailability,
}: Props) {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const [venues] = useState<VenueInfo[]>(() => getStoredVenues());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const toggleVenue = (venue: VenueType) => {
    const exists = formData.venues?.includes(venue);
    setFormData({
      ...formData,
      venues: exists
        ? (formData.venues || []).filter((v) => v !== venue)
        : [...(formData.venues || []), venue],
    });
  };

  const updateSlot = (index: number, patch: Partial<DateRange>) => {
    const next = [...formData.eventDates];
    next[index] = { ...next[index], ...patch };
    setFormData({ ...formData, eventDates: next });
  };

  const addSlot = () => {
    setFormData({
      ...formData,
      eventDates: [
        ...formData.eventDates,
        { date: '', startTime: '09:00', endTime: '12:00' },
      ],
    });
  };

  const removeSlot = (index: number) => {
    if (formData.eventDates.length <= 1) return;
    setFormData({
      ...formData,
      eventDates: formData.eventDates.filter((_, i) => i !== index),
    });
  };

  const filtered = categoryFilter === 'all'
    ? venues
    : venues.filter((v) => v.category === categoryFilter);

  /** السعة المسموح بها للقاعة حسب نوع الفعالية المختار */
  const capacityFor = (v: VenueInfo): number | string => {
    const et = formData.venueEventType;
    if (!et || !v.capacityByEventType) return v.capacity;
    const val = v.capacityByEventType[et];
    return val === undefined ? v.capacity : val;
  };

  return (
    <div className="space-y-6">
      {/* نوع الفعالية — يحدد السعة المسموحة لكل قاعة */}
      <div className="rounded-xl bg-primary-50/40 border border-primary/15 p-3">
        <label className="label !mb-2">{t('form.event_type')}</label>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => setFormData({ ...formData, venueEventType: et })}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                formData.venueEventType === et
                  ? 'bg-primary text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t(`form.event_type.${et}`)}
            </button>
          ))}
        </div>
        {formData.venueEventType && (
          <p className="text-[11px] text-slate-500 mt-2">
            {isAr
              ? 'تُعرض السعة المسموح بها لكل قاعة وفق نوع الفعالية المختار.'
              : 'Allowed capacity per venue is shown based on the selected event type.'}
          </p>
        )}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <label className="label !mb-0 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>{t('form.venues.label')}</span>
          </label>
          <button
            type="button"
            onClick={() => setShowAvailability(true)}
            className="btn-ghost text-xs text-primary self-start sm:self-auto !py-1 !px-2.5 border border-primary/20 bg-primary-50/50 rounded-md"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{t('form.venues.show_availability')}</span>
          </button>
        </div>

        {/* Category Filter for Venues Selection */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'auditorium', labelAr: 'المسارح الكبرى', labelEn: 'Auditoriums' },
            { id: 'exhibition', labelAr: 'المعارض والبهو', labelEn: 'Exhibition' },
            { id: 'vip', labelAr: 'أجنحة VIP', labelEn: 'VIP' },
            { id: 'tiered', labelAr: 'القاعات المدرجة', labelEn: 'Tiered' },
            { id: 'workshop', labelAr: 'ورش العمل', labelEn: 'Workshops' },
            { id: 'meeting', labelAr: 'قاعات الاجتماعات', labelEn: 'Meetings' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                categoryFilter === c.id
                  ? 'bg-primary text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? c.labelAr : c.labelEn}
            </button>
          ))}
        </div>

        {/* Venues Grid Selection */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto p-1 border border-slate-100 rounded-xl">
          {filtered.map((v) => {
            const selected = formData.venues?.includes(v.id);
            const cap = capacityFor(v);
            const isDefault = cap === v.capacity;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => toggleVenue(v.id)}
                className={`text-start p-3 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  selected
                    ? 'border-primary bg-primary-50/70 shadow-xs ring-1 ring-primary'
                    : 'border-slate-200 hover:border-primary-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">
                    {language === 'ar' ? v.nameAr : v.nameEn}
                  </div>
                  {selected && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span
                    className={`font-semibold ${
                      isDefault ? 'text-primary' : 'text-emerald-600'
                    }`}
                    title={isDefault ? t('form.capacity_default') : t('form.capacity_by_event')}
                  >
                    {cap} {t('venues.persons')}
                    {!isDefault && (
                      <span className="block text-[9px] text-emerald-500/80 font-normal">
                        {t('form.capacity_by_event')}
                      </span>
                    )}
                  </span>
                  <span className="truncate max-w-[140px] text-slate-400">
                    {v.location}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <VenueAvailabilityPopup
          open={showAvailability}
          onClose={() => setShowAvailability(false)}
          requests={allRequests}
          selectedVenues={formData.venues || []}
        />
      </div>

      <div>
        <label className="label">{t('form.dates.label')}</label>
        <div className="space-y-3">
          {formData.eventDates.map((slot, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('form.dates.date')}</label>
                <input
                  type="date"
                  className="input-field !py-2"
                  value={slot.date || ''}
                  onChange={(e) => updateSlot(i, { date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('form.dates.from_time')}</label>
                <input
                  type="time"
                  className="input-field !py-2"
                  value={slot.startTime || ''}
                  onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">{t('form.dates.to_time')}</label>
                  <input
                    type="time"
                    className="input-field !py-2"
                    value={slot.endTime || ''}
                    onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                    required
                  />
                </div>
                {formData.eventDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    className="btn-ghost text-rose-500 !px-2 mb-0.5"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSlot} className="btn-ghost text-sm mt-2 text-primary">
          + {t('form.dates.add_slot')}
        </button>
      </div>
    </div>
  );
}

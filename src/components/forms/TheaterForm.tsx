import { CalendarDays, MapPin } from 'lucide-react';
import type { ServiceFormData, VenueType, ServiceRequest, DateRange } from '../../types';
import VenueAvailabilityPopup from '../VenueAvailabilityPopup';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_VENUES } from '../../data/defaults';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
  allRequests: ServiceRequest[];
  showAvailability: boolean;
  setShowAvailability: (show: boolean) => void;
}

export default function TheaterForm({
  formData,
  setFormData,
  allRequests,
  showAvailability,
  setShowAvailability,
}: Props) {
  const { t, language } = useLanguage();

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

  return (
    <div className="space-y-5">
      <div>
        <label className="label flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {t('form.venues.label')}
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          {DEFAULT_VENUES.map((v) => {
            const selected = formData.venues?.includes(v.id);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => toggleVenue(v.id)}
                className={`text-start p-3 rounded-xl border-2 transition-all ${
                  selected
                    ? 'border-primary bg-primary-50 shadow-sm'
                    : 'border-slate-200 hover:border-primary-200 bg-white'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">
                  {language === 'ar' ? v.nameAr : v.nameEn}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {v.capacity} {t('venues.persons')}
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowAvailability(true)}
          className="btn-ghost text-xs mt-2 text-primary"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {t('form.venues.show_availability')}
        </button>
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

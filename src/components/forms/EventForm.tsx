import { useState } from 'react';
import type { ServiceFormData, VenueInfo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoredVenues } from '../../utils/storage';
import { Check } from 'lucide-react';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function EventForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '', endTime: '' };
  const [venues] = useState<VenueInfo[]>(() => getStoredVenues());

  const setSlot = (patch: Partial<typeof slot>) => {
    setFormData({
      ...formData,
      eventDates: [{ ...slot, ...patch }],
    });
  };

  const toggleVenue = (id: string) => {
    const current = formData.venues || [];
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];
    setFormData({ ...formData, venues: next });
  };

  const eventType = formData.additionalNotes || '';

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{language === 'ar' ? 'اسم الفعالية' : 'Event name'}</label>
        <input
          type="text"
          className="input-field"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{language === 'ar' ? 'تفاصيل الفعالية والتجهيزات المطلوبة' : 'Event details and required setup'}</label>
        <textarea
          className="input-field min-h-[90px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">{t('form.dates.date')}</label>
          <input
            type="date"
            className="input-field"
            value={slot.date || ''}
            onChange={(e) => setSlot({ date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">{t('form.dates.from_time')}</label>
          <input
            type="time"
            className="input-field"
            value={slot.startTime || ''}
            onChange={(e) => setSlot({ startTime: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">{t('form.dates.to_time')}</label>
          <input
            type="time"
            className="input-field"
            value={slot.endTime || ''}
            onChange={(e) => setSlot({ endTime: e.target.value })}
            required
          />
        </div>
      </div>

      {/* نوع الفعالية + حقل "أخرى" النصي */}
      <div>
        <label className="label">{language === 'ar' ? 'نوع الفعالية' : 'Event type'}</label>
        <select
          className="input-field"
          value={eventType}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          required
        >
          <option value="">{t('form.select')}</option>
          <option value="ceremony">{language === 'ar' ? 'حفل / تكريم' : 'Ceremony'}</option>
          <option value="conference">{language === 'ar' ? 'مؤتمر' : 'Conference'}</option>
          <option value="forum">{language === 'ar' ? 'ملتقى / ندوة' : 'Forum / seminar'}</option>
          <option value="exhibition">{language === 'ar' ? 'معرض' : 'Exhibition'}</option>
          <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
        </select>
      </div>
      {eventType === 'other' && (
        <div>
          <label className="label">{t('form.event_type.other_label')}</label>
          <input
            type="text"
            className="input-field"
            value={formData.otherEventType || ''}
            onChange={(e) => setFormData({ ...formData, otherEventType: e.target.value })}
            placeholder={language === 'ar' ? 'اكتب نوع الفعالية' : 'Type the event type'}
            required
          />
        </div>
      )}

      {/* طلب حجز قاعة ضمن النموذج */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary w-4 h-4"
            checked={!!formData.needsVenueBooking}
            onChange={(e) =>
              setFormData({ ...formData, needsVenueBooking: e.target.checked })
            }
          />
          <span className="text-sm font-semibold text-slate-700">{t('form.needs_venue')}</span>
        </label>
        {formData.needsVenueBooking && (
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto p-1">
            {venues.map((v) => {
              const selected = (formData.venues || []).includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVenue(v.id)}
                  className={`text-start p-2.5 rounded-lg border-2 transition-all flex flex-col gap-1 ${
                    selected
                      ? 'border-primary bg-primary-50/70 ring-1 ring-primary'
                      : 'border-slate-200 hover:border-primary-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-800">
                      {language === 'ar' ? v.nameAr : v.nameEn}
                    </span>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-primary-700 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-primary font-semibold">
                    {v.capacity} {t('venues.persons')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* طلب توثيق المناسبة */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary w-4 h-4"
            checked={!!formData.needsDocumentation}
            onChange={(e) =>
              setFormData({ ...formData, needsDocumentation: e.target.checked })
            }
          />
          <span className="text-sm font-semibold text-slate-700">{t('form.needs_documentation')}</span>
        </label>
        {formData.needsDocumentation && (
          <div className="mt-3">
            <label className="label">{t('form.documentation_type')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['photo', 'video', 'both'] as const).map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setFormData({ ...formData, documentationType: dt })}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    formData.documentationType === dt
                      ? 'border-primary bg-primary-50/70 text-primary font-bold ring-1 ring-primary'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                  }`}
                >
                  {t(`form.doc_type.${dt}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function EventForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '', endTime: '' };

  const setSlot = (patch: Partial<typeof slot>) => {
    setFormData({
      ...formData,
      eventDates: [{ ...slot, ...patch }],
    });
  };

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
      <div>
        <label className="label">{language === 'ar' ? 'نوع الفعالية' : 'Event type'}</label>
        <select
          className="input-field"
          value={formData.additionalNotes || ''}
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
    </div>
  );
}

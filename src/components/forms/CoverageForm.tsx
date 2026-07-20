import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function CoverageForm({ formData, setFormData }: Props) {
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
        <label className="label">{t('form.title')}</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="input-field"
          required
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">{t('form.dates.date')}</label>
          <input
            type="date"
            value={slot.date || ''}
            onChange={(e) => setSlot({ date: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label">{t('form.dates.from_time')}</label>
          <input
            type="time"
            value={slot.startTime || ''}
            onChange={(e) => setSlot({ startTime: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label">{t('form.dates.to_time')}</label>
          <input
            type="time"
            value={slot.endTime || ''}
            onChange={(e) => setSlot({ endTime: e.target.value })}
            className="input-field"
            required
          />
        </div>
      </div>
      <div>
        <label className="label">{language === 'ar' ? 'مكان التغطية' : 'Coverage location'}</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="label">{language === 'ar' ? 'نوع التغطية' : 'Coverage type'}</label>
        <select
          className="input-field"
          value={formData.additionalNotes || ''}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          required
        >
          <option value="">{t('form.select')}</option>
          <option value="video">{language === 'ar' ? 'تصوير فيديو' : 'Video'}</option>
          <option value="live">{language === 'ar' ? 'بث مباشر' : 'Live stream'}</option>
          <option value="news">{language === 'ar' ? 'تغطية إخبارية' : 'News coverage'}</option>
        </select>
      </div>
    </div>
  );
}

import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function OtherForm({ formData, setFormData }: Props) {
  const { t } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{t('form.title')}</label>
        <input
          type="text"
          className="input-field"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('form.description')}</label>
        <textarea
          className="input-field min-h-[100px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('form.dates.date')}</label>
        <input
          type="date"
          className="input-field"
          value={slot.date || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              eventDates: [{ date: e.target.value, startTime: '00:00', endTime: '23:59' }],
            })
          }
        />
      </div>
    </div>
  );
}

import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function DesignForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{language === 'ar' ? 'اسم الحملة / المشروع' : 'Campaign / Project name'}</label>
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
          className="input-field min-h-[90px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{language === 'ar' ? 'تاريخ التسليم المطلوب' : 'Required delivery date'}</label>
          <input
            type="date"
            className="input-field"
            value={slot.date || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                eventDates: [{ ...slot, date: e.target.value, startTime: '00:00', endTime: '23:59' }],
              })
            }
            required
          />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'نوع التصميم' : 'Design type'}</label>
          <select
            className="input-field"
            value={formData.additionalNotes || ''}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          >
            <option value="">{t('form.select')}</option>
            <option value="poster">{language === 'ar' ? 'بوستر / بانر' : 'Poster / Banner'}</option>
            <option value="social">{language === 'ar' ? 'منشورات سوشيال' : 'Social posts'}</option>
            <option value="identity">{language === 'ar' ? 'هوية بصرية' : 'Visual identity'}</option>
            <option value="print">{language === 'ar' ? 'مطبوعات' : 'Print materials'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

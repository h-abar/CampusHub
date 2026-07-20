import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function TranslationForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
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
        <label className="label">{language === 'ar' ? 'نص / وصف المحتوى' : 'Content description'}</label>
        <textarea
          className="input-field min-h-[120px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{language === 'ar' ? 'تاريخ التسليم' : 'Delivery date'}</label>
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
            required
          />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'اتجاه الترجمة' : 'Translation direction'}</label>
          <select
            className="input-field"
            value={formData.additionalNotes || ''}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          >
            <option value="">{t('form.select')}</option>
            <option value="ar-en">{language === 'ar' ? 'عربي ← إنجليزي' : 'Arabic → English'}</option>
            <option value="en-ar">{language === 'ar' ? 'إنجليزي ← عربي' : 'English → Arabic'}</option>
            <option value="both">{language === 'ar' ? 'ثنائي الاتجاه' : 'Both directions'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

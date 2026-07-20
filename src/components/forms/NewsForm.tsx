import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function NewsForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{language === 'ar' ? 'عنوان الخبر' : 'News headline'}</label>
        <input
          type="text"
          className="input-field"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{language === 'ar' ? 'نص الخبر / البيان' : 'News / press release body'}</label>
        <textarea
          className="input-field min-h-[110px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{language === 'ar' ? 'تاريخ النشر المطلوب' : 'Requested publish date'}</label>
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
          <label className="label">{language === 'ar' ? 'جهة النشر' : 'Publishing channel'}</label>
          <select
            className="input-field"
            value={formData.additionalNotes || ''}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            required
          >
            <option value="">{t('form.select')}</option>
            <option value="website">{language === 'ar' ? 'موقع الجامعة' : 'University website'}</option>
            <option value="social">{language === 'ar' ? 'حسابات التواصل' : 'Social accounts'}</option>
            <option value="press">{language === 'ar' ? 'صحف ووسائل إعلام' : 'Press & media outlets'}</option>
            <option value="all">{language === 'ar' ? 'جميع القنوات' : 'All channels'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

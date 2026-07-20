import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

export default function WorkshopForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{language === 'ar' ? 'اسم ورشة العمل' : 'Workshop name'}</label>
        <input
          type="text"
          className="input-field"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{language === 'ar' ? 'وصف الورشة وأهدافها' : 'Workshop description and goals'}</label>
        <textarea
          className="input-field min-h-[90px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{language === 'ar' ? 'تاريخ الورشة' : 'Workshop date'}</label>
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
          <label className="label">{language === 'ar' ? 'المطلوب تصميمه' : 'Design deliverables'}</label>
          <select
            className="input-field"
            value={formData.additionalNotes || ''}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            required
          >
            <option value="">{t('form.select')}</option>
            <option value="kit">{language === 'ar' ? 'حقيبة تدريبية' : 'Training kit'}</option>
            <option value="banners">{language === 'ar' ? 'بانرات ولوحات' : 'Banners & boards'}</option>
            <option value="certificates">{language === 'ar' ? 'شهادات حضور' : 'Attendance certificates'}</option>
            <option value="slides">{language === 'ar' ? 'عرض تقديمي' : 'Presentation slides'}</option>
            <option value="full">{language === 'ar' ? 'هوية كاملة للورشة' : 'Full workshop identity'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

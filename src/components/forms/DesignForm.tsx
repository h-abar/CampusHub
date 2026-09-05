import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

const LOGO_OPTIONS = ['university', 'college', 'entity', 'other'] as const;

export default function DesignForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  const toggleLogo = (logo: string) => {
    const current = formData.designLogos || [];
    const next = current.includes(logo)
      ? current.filter((l) => l !== logo)
      : [...current, logo];
    setFormData({ ...formData, designLogos: next });
  };

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

      {/* وصف التصميم المطلوب — مستقل عن وصف الموضوع */}
      <div>
        <label className="label">{t('form.design_brief')}</label>
        <textarea
          className="input-field min-h-[90px]"
          value={formData.designBrief || ''}
          onChange={(e) => setFormData({ ...formData, designBrief: e.target.value })}
          placeholder={language === 'ar' ? 'صف التصميم أو المحتوى المطلوب' : 'Describe the design or content required'}
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* لغة التصميم */}
        <div>
          <label className="label">{t('form.design_language')}</label>
          <select
            className="input-field"
            value={formData.designLanguage || ''}
            onChange={(e) =>
              setFormData({ ...formData, designLanguage: e.target.value as ServiceFormData['designLanguage'] })
            }
            required
          >
            <option value="">{t('form.select')}</option>
            <option value="ar">{t('form.design_language.ar')}</option>
            <option value="en">{t('form.design_language.en')}</option>
            <option value="both">{t('form.design_language.both')}</option>
          </select>
        </div>

        {/* الفئة المستهدفة */}
        <div>
          <label className="label">{t('form.target_audience')}</label>
          <select
            className="input-field"
            value={formData.targetAudience || ''}
            onChange={(e) =>
              setFormData({ ...formData, targetAudience: e.target.value as ServiceFormData['targetAudience'] })
            }
            required
          >
            <option value="">{t('form.select')}</option>
            <option value="students">{t('form.audience.students')}</option>
            <option value="staff">{t('form.audience.staff')}</option>
            <option value="faculty">{t('form.audience.faculty')}</option>
            <option value="external">{t('form.audience.external')}</option>
            <option value="all">{t('form.audience.all')}</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* نوع التصميم */}
        <div>
          <label className="label">{t('form.design_category')}</label>
          <select
            className="input-field"
            value={formData.designCategory || ''}
            onChange={(e) => setFormData({ ...formData, designCategory: e.target.value })}
            required
          >
            <option value="">{t('form.select')}</option>
            <option value="course_ad">{t('form.design_category.course_ad')}</option>
            <option value="lecture">{t('form.design_category.lecture')}</option>
            <option value="workshop">{t('form.design_category.workshop')}</option>
            <option value="poster">{language === 'ar' ? 'بوستر / بانر' : 'Poster / Banner'}</option>
            <option value="social">{language === 'ar' ? 'منشورات سوشيال' : 'Social posts'}</option>
            <option value="identity">{language === 'ar' ? 'هوية بصرية' : 'Visual identity'}</option>
            <option value="print">{language === 'ar' ? 'مطبوعات' : 'Print materials'}</option>
            <option value="other">{t('form.design_category.other')}</option>
          </select>
        </div>

        {/* تاريخ التسليم */}
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
      </div>

      {/* الروابط */}
      <div>
        <label className="label">{t('form.design_links')}</label>
        <textarea
          className="input-field min-h-[70px]"
          value={formData.designLinks || ''}
          onChange={(e) => setFormData({ ...formData, designLinks: e.target.value })}
          placeholder={t('form.design_links_placeholder')}
        />
      </div>

      {/* الشعارات */}
      <div>
        <label className="label">{t('form.design_logos')}</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {LOGO_OPTIONS.map((logo) => {
            const checked = (formData.designLogos || []).includes(logo);
            return (
              <label
                key={logo}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary bg-primary-50/60 ring-1 ring-primary'
                    : 'border-slate-200 hover:border-primary-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4"
                  checked={checked}
                  onChange={() => toggleLogo(logo)}
                />
                <span className="text-sm text-slate-700">{t(`form.logo.${logo}`)}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

const LOGO_OPTIONS = ['university', 'college', 'entity', 'other'] as const;
const ATTACHMENTS = ['cv', 'bio', 'photo'] as const;

export default function WorkshopForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  const toggleLogo = (logo: string) => {
    const current = formData.designLogos || [];
    const next = current.includes(logo)
      ? current.filter((l) => l !== logo)
      : [...current, logo];
    setFormData({ ...formData, designLogos: next });
  };

  const toggleAttachment = (att: string) => {
    const current = formData.workshopAttachments || [];
    const next = current.includes(att)
      ? current.filter((a) => a !== att)
      : [...current, att];
    setFormData({ ...formData, workshopAttachments: next });
  };

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

      {/* وصف الورشة وأهدافها — يبقى مستقلاً عن وصف التصميم */}
      <div>
        <label className="label">{language === 'ar' ? 'وصف الورشة وأهدافها' : 'Workshop description and goals'}</label>
        <textarea
          className="input-field min-h-[90px]"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      {/* وصف التصميم / المحتوى المطلوب — مستقل */}
      <div>
        <label className="label">{t('form.design_brief')}</label>
        <textarea
          className="input-field min-h-[80px]"
          value={formData.designBrief || ''}
          onChange={(e) => setFormData({ ...formData, designBrief: e.target.value })}
          placeholder={language === 'ar' ? 'صف التصميم أو المحتوى المطلوب فقط' : 'Describe the design or content required only'}
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
            <option value="kit">{language === 'ar' ? 'حقيبة تدريبية' : 'Training kit'}</option>
            <option value="banners">{language === 'ar' ? 'بانرات ولوحات' : 'Banners & boards'}</option>
            <option value="certificates">{language === 'ar' ? 'شهادات حضور' : 'Attendance certificates'}</option>
            <option value="slides">{language === 'ar' ? 'عرض تقديمي' : 'Presentation slides'}</option>
            <option value="full">{language === 'ar' ? 'هوية كاملة للورشة' : 'Full workshop identity'}</option>
            <option value="other">{t('form.design_category.other')}</option>
          </select>
        </div>

        {/* تاريخ الورشة */}
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
      </div>

      {/* مرفقات ورشة العمل */}
      <div>
        <label className="label">{t('form.workshop_attachments')}</label>
        <div className="grid sm:grid-cols-3 gap-2">
          {ATTACHMENTS.map((att) => {
            const checked = (formData.workshopAttachments || []).includes(att);
            return (
              <label
                key={att}
                className={`flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary bg-primary-50/60 ring-1 ring-primary'
                    : 'border-slate-200 hover:border-primary-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4"
                    checked={checked}
                    onChange={() => toggleAttachment(att)}
                  />
                  <span className="text-sm text-slate-700">{t(`form.attachment.${att}`)}</span>
                </div>
                {checked && (
                  <input
                    type="file"
                    className="text-[11px] text-slate-500 file:mr-2 file:ml-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const current = formData.workshopAttachments || [];
                        if (!current.includes(att)) {
                          setFormData({
                            ...formData,
                            workshopAttachments: [...current, att],
                          });
                        }
                      }
                    }}
                  />
                )}
              </label>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {language === 'ar'
            ? 'يُشار إلى المرفقات في الطلب؛ الرفع الفعلي يتطلب خادم تخزين.'
            : 'Attachments are referenced in the request; actual upload requires a storage backend.'}
        </p>
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

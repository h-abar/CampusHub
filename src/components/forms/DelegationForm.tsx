import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

const SUPPORT_SERVICES = ['airport_reception', 'transport', 'hotel'] as const;

export default function DelegationForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '', endTime: '' };

  const setSlot = (patch: Partial<typeof slot>) => {
    setFormData({
      ...formData,
      eventDates: [{ ...slot, ...patch }],
    });
  };

  const toggleService = (svc: string) => {
    const current = formData.supportServices || [];
    const next = current.includes(svc)
      ? current.filter((s) => s !== svc)
      : [...current, svc];
    setFormData({ ...formData, supportServices: next });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">{language === 'ar' ? 'اسم الجهة / الوفد' : 'Entity / delegation name'}</label>
        <input
          type="text"
          className="input-field"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{language === 'ar' ? 'تفاصيل الزيارة وأهدافها' : 'Visit details and objectives'}</label>
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
        <label className="label">{language === 'ar' ? 'نوع الوفد' : 'Delegation type'}</label>
        <select
          className="input-field"
          value={formData.additionalNotes || ''}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          required
        >
          <option value="">{t('form.select')}</option>
          <option value="government">{language === 'ar' ? 'وفد حكومي' : 'Government delegation'}</option>
          <option value="academic">{language === 'ar' ? 'وفد أكاديمي / تعليمي' : 'Academic delegation'}</option>
          <option value="health">{language === 'ar' ? 'وفد صحي' : 'Health sector delegation'}</option>
          <option value="corporate">{language === 'ar' ? 'وفد شركات / قطاع خاص' : 'Corporate delegation'}</option>
          <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
        </select>
      </div>

      {/* العدد المتوقع للزوار + الفئة المستهدفة (الجنس) */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">{t('form.expected_visitors')}</label>
          <input
            type="number"
            min={1}
            className="input-field"
            value={formData.expectedVisitors ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, expectedVisitors: e.target.value ? Number(e.target.value) : undefined })
            }
            required
          />
        </div>
        <div>
          <label className="label">{t('form.visitor_gender')}</label>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'both'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData({ ...formData, visitorGender: g })}
                className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                  formData.visitorGender === g
                    ? 'border-primary bg-primary-50/70 text-primary font-bold ring-1 ring-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                }`}
              >
                {t(`form.gender.${g}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* الخدمات المساندة */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
        <label className="label !mb-2">{t('form.support_services')}</label>
        <div className="grid sm:grid-cols-3 gap-2">
          {SUPPORT_SERVICES.map((svc) => {
            const checked = (formData.supportServices || []).includes(svc);
            return (
              <label
                key={svc}
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
                  onChange={() => toggleService(svc)}
                />
                <span className="text-sm text-slate-700">{t(`form.service.${svc}`)}</span>
              </label>
            );
          })}
        </div>
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

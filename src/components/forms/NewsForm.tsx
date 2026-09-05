import type { ServiceFormData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
}

const CHANNELS = [
  'website',
  'social',
  'press',
  'message_center',
  'display_screens',
] as const;

export default function NewsForm({ formData, setFormData }: Props) {
  const { t, language } = useLanguage();
  const slot = formData.eventDates[0] || { date: '', startTime: '00:00', endTime: '23:59' };

  const toggleChannel = (ch: string) => {
    const current = formData.publishingChannels || [];
    const next = current.includes(ch)
      ? current.filter((c) => c !== ch)
      : [...current, ch];
    setFormData({ ...formData, publishingChannels: next });
  };

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
        {/* تاريخ الخبر — مستقل عن تاريخ النشر */}
        <div>
          <label className="label">{t('form.news_date')}</label>
          <input
            type="date"
            className="input-field"
            value={formData.newsDate || ''}
            onChange={(e) => setFormData({ ...formData, newsDate: e.target.value })}
            required
          />
        </div>
        {/* تاريخ النشر المطلوب */}
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
      </div>

      {/* قنوات النشر — متعددة مع مركز الرسائل وشاشات العرض */}
      <div>
        <label className="label">{t('form.publishing_channels')}</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CHANNELS.map((ch) => {
            const checked = (formData.publishingChannels || []).includes(ch);
            return (
              <label
                key={ch}
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
                  onChange={() => toggleChannel(ch)}
                />
                <span className="text-sm text-slate-700">{t(`form.channel.${ch}`)}</span>
              </label>
            );
          })}
          <label
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              (formData.publishingChannels || []).length === CHANNELS.length
                ? 'border-primary bg-primary-50/60 ring-1 ring-primary'
                : 'border-slate-200 hover:border-primary-200 bg-white'
            }`}
          >
            <input
              type="checkbox"
              className="accent-primary w-4 h-4"
              checked={(formData.publishingChannels || []).length === CHANNELS.length}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  publishingChannels: e.target.checked ? [...CHANNELS] : [],
                })
              }
            />
            <span className="text-sm font-semibold text-primary">{t('form.channel.all')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

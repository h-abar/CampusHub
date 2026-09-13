import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import type {
  College,
  DateRange,
  ExternalEntity,
  ServiceFormData,
  ServiceRequest,
  VenueEventType,
  VenueInfo,
  VenueType,
} from '../../types';
import VenueAvailabilityPopup from '../VenueAvailabilityPopup';
import { useLanguage } from '../../context/LanguageContext';
import { getStoredVenues } from '../../utils/storage';
import { normalizeDateRange, rangesOverlap, formatDate, formatTime } from '../../utils/dateUtils';

interface Props {
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
  allRequests: ServiceRequest[];
  showAvailability: boolean;
  setShowAvailability: (show: boolean) => void;
  colleges: College[];
  externalEntities: ExternalEntity[];
  collegeId: string;
  setCollegeId: (v: string) => void;
  deptName: string;
  setDeptName: (v: string) => void;
  submitting: boolean;
}

const EVENT_TYPES: { id: VenueEventType; ar: string; en: string }[] = [
  { id: 'exam', ar: 'اختبار', en: 'Exam' },
  { id: 'workshop', ar: 'ورشة عمل', en: 'Workshop' },
  { id: 'lecture', ar: 'محاضرة', en: 'Lecture' },
  { id: 'conference', ar: 'مؤتمر', en: 'Conference' },
  { id: 'ceremony', ar: 'حفل / مناسبة', en: 'Ceremony' },
  { id: 'exhibition', ar: 'معرض', en: 'Exhibition' },
  { id: 'meeting', ar: 'اجتماع', en: 'Meeting' },
  { id: 'other', ar: 'أخرى', en: 'Other' },
];

const VENUE_CATEGORIES: { id: string; ar: string; en: string }[] = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'auditorium', ar: 'المسارح الكبرى', en: 'Auditoriums' },
  { id: 'exhibition', ar: 'المعارض والبهو', en: 'Exhibition' },
  { id: 'vip', ar: 'أجنحة VIP', en: 'VIP' },
  { id: 'tiered', ar: 'القاعات المدرجة', en: 'Tiered' },
  { id: 'workshop', ar: 'ورش العمل', en: 'Workshops' },
  { id: 'meeting', ar: 'قاعات الاجتماعات', en: 'Meetings' },
];

export default function TheaterBookingWizard({
  formData,
  setFormData,
  allRequests,
  showAvailability,
  setShowAvailability,
  colleges,
  externalEntities,
  collegeId,
  setCollegeId,
  deptName,
  setDeptName,
  submitting,
}: Props) {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const ArrowFwd = isAr ? ArrowLeft : ArrowRight;
  const ArrowBack = isAr ? ArrowRight : ArrowLeft;

  const [venues] = useState<VenueInfo[]>(() => getStoredVenues());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');

  const STEPS = [
    { id: 'event', icon: Sparkles, ar: 'الفعالية والقاعات', en: 'Event & Venues' },
    { id: 'schedule', icon: CalendarDays, ar: 'المواعيد', en: 'Schedule' },
    { id: 'requester', icon: User, ar: 'الجهة والتواصل', en: 'Requester' },
    { id: 'review', icon: ClipboardCheck, ar: 'المراجعة', en: 'Review' },
  ];

  /* ---------- helpers ---------- */
  const toggleVenue = (venue: VenueType) => {
    const exists = formData.venues?.includes(venue);
    setFormData({
      ...formData,
      venues: exists
        ? (formData.venues || []).filter((v) => v !== venue)
        : [...(formData.venues || []), venue],
    });
  };

  const updateSlot = (index: number, patch: Partial<DateRange>) => {
    const next = [...formData.eventDates];
    next[index] = { ...next[index], ...patch };
    setFormData({ ...formData, eventDates: next });
  };

  const addSlot = () =>
    setFormData({
      ...formData,
      eventDates: [...formData.eventDates, { date: '', startTime: '09:00', endTime: '12:00' }],
    });

  const removeSlot = (index: number) => {
    if (formData.eventDates.length <= 1) return;
    setFormData({
      ...formData,
      eventDates: formData.eventDates.filter((_, i) => i !== index),
    });
  };

  const capacityFor = (v: VenueInfo): number | string => {
    const et = formData.venueEventType;
    if (!et || !v.capacityByEventType) return v.capacity;
    const val = v.capacityByEventType[et];
    return val === undefined ? v.capacity : val;
  };

  /** هل القاعة متاحة في الفترة؟ (لا تعارض مع حجوزات نشطة) */
  const isVenueAvailable = (venue: VenueType, range: DateRange) => {
    const slot = normalizeDateRange(range);
    if (!slot.date || !slot.startTime || !slot.endTime) return true;
    for (const req of allRequests) {
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      if (!req.venues?.includes(venue)) continue;
      for (const raw of req.eventDates || []) {
        if (rangesOverlap(slot, normalizeDateRange(raw))) return false;
      }
    }
    return true;
  };

  /** خريطة التوفر: slotIndex -> venueId -> available */
  const availabilityMap = useMemo(() => {
    const m: Record<number, Record<string, boolean>> = {};
    formData.eventDates.forEach((slot, i) => {
      m[i] = {};
      (formData.venues || []).forEach((v) => {
        m[i][v] = isVenueAvailable(v, slot);
      });
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.eventDates, formData.venues, allRequests]);

  const hasConflict = useMemo(
    () => Object.values(availabilityMap).some((row) => Object.values(row).some((ok) => !ok)),
    [availabilityMap]
  );

  const filteredVenues =
    categoryFilter === 'all' ? venues : venues.filter((v) => v.category === categoryFilter);

  const departments = useMemo(() => {
    const col = colleges.find((c) => c.id === collegeId);
    return (col?.departments || []).filter((d) => d.enabled);
  }, [colleges, collegeId]);

  const venueName = (id: string) => {
    const v = venues.find((x) => x.id === id);
    return v ? (isAr ? v.nameAr : v.nameEn) : id;
  };

  /* ---------- step validation ---------- */
  const validateStep = (s: number): string => {
    if (s === 0) {
      if (!formData.venueEventType) return isAr ? 'اختر نوع الفعالية' : 'Select event type';
      if (!formData.title.trim()) return isAr ? 'أدخل عنوان الفعالية' : 'Enter event title';
      if (!formData.venues?.length) return isAr ? 'اختر قاعة واحدة على الأقل' : 'Select at least one venue';
    }
    if (s === 1) {
      for (const slot of formData.eventDates) {
        if (!slot.date || !slot.startTime || !slot.endTime)
          return isAr ? 'أكمل التاريخ والوقت لكل موعد' : 'Complete date & time for every slot';
        if (slot.startTime >= slot.endTime)
          return isAr ? 'وقت النهاية يجب أن يكون بعد البداية' : 'End time must be after start';
      }
      if (hasConflict)
        return isAr
          ? 'يوجد تعارض مع حجز قائم — عدّل الموعد أو افتح جدول الإتاحة'
          : 'A slot conflicts with an existing booking — adjust it or open availability';
    }
    if (s === 2) {
      if (!formData.requesterName.trim()) return isAr ? 'أدخل اسم مقدم الطلب' : 'Enter requester name';
      if (!formData.requesterEmail.trim()) return isAr ? 'أدخل البريد الإلكتروني' : 'Enter email';
      if (formData.requesterType === 'internal' && (!collegeId || !deptName))
        return isAr ? 'اختر الكلية والقسم' : 'Select college & department';
      if (formData.requesterType === 'external' && !formData.externalEntity)
        return isAr ? 'اختر الجهة الخارجية' : 'Select external entity';
    }
    return '';
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div
      className="space-y-6"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
    >
      {/* ===== Stepper ===== */}
      <div className="bg-white rounded-2xl border border-[var(--line)] shadow-panel p-4">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className="flex flex-col items-center gap-1.5 group disabled:cursor-default"
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                      done
                        ? 'bg-primary-700 border-primary-700 text-white'
                        : active
                          ? 'border-primary-700 text-primary-700 bg-primary-50 ring-4 ring-primary-100'
                          : 'border-slate-200 text-slate-400 bg-white'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                      active ? 'text-primary-800' : done ? 'text-ink-600' : 'text-slate-400'
                    }`}
                  >
                    {isAr ? s.ar : s.en}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-colors ${
                      i < step ? 'bg-primary-700' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {stepError && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {stepError}
        </div>
      )}

      {/* ===== STEP 1: Event details + Venues ===== */}
      {step === 0 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-xl bg-primary-50/40 border border-primary/15 p-4">
            <label className="label !mb-2">{t('form.event_type')}</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, venueEventType: et.id })}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    formData.venueEventType === et.id
                      ? 'bg-primary-700 text-white font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {isAr ? et.ar : et.en}
                </button>
              ))}
            </div>
            {formData.venueEventType && (
              <p className="text-[11px] text-slate-500 mt-2">
                {isAr
                  ? 'تُعرض السعة المسموح بها لكل قاعة وفق نوع الفعالية المختار.'
                  : 'Allowed capacity per venue follows the selected event type.'}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">{t('form.title')}</label>
              <input
                type="text"
                className="input-field"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={isAr ? 'مثال: مؤتمر التقنية الطبية السنوي' : 'e.g. Annual HealthTech Conference'}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('form.description')}</label>
              <textarea
                className="input-field min-h-[80px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isAr ? 'وصف مختصر للفعالية وأهدافها' : 'Brief description of the event'}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="label !mb-0 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>{t('form.venues.label')}</span>
                {formData.venues?.length ? (
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                    {formData.venues.length} {isAr ? 'مختارة' : 'selected'}
                  </span>
                ) : null}
              </label>
              <button
                type="button"
                onClick={() => setShowAvailability(true)}
                className="btn-ghost text-xs text-primary self-start sm:self-auto !py-1 !px-2.5 border border-primary/20 bg-primary-50/50 rounded-md"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{t('form.venues.show_availability')}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {VENUE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === c.id
                      ? 'bg-primary-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? c.ar : c.en}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {filteredVenues.map((v) => {
                const selected = formData.venues?.includes(v.id);
                const cap = capacityFor(v);
                const isDefault = cap === v.capacity;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVenue(v.id)}
                    className={`text-start rounded-xl border-2 transition-all overflow-hidden flex flex-col ${
                      selected
                        ? 'border-primary bg-primary-50/70 shadow-xs ring-1 ring-primary'
                        : 'border-slate-200 hover:border-primary-200 bg-white'
                    }`}
                  >
                    {v.image && (
                      <div className="h-20 relative overflow-hidden">
                        <img src={v.image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-1.5 end-2 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded font-mono">
                          {cap} {isAr ? 'مقعد' : 'seats'}
                        </span>
                      </div>
                    )}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">
                          {isAr ? v.nameAr : v.nameEn}
                        </div>
                        {selected && (
                          <span className="w-5 h-5 rounded-full bg-primary-700 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span
                          className={`font-semibold flex items-center gap-1 ${isDefault ? 'text-primary' : 'text-emerald-600'}`}
                          title={isDefault ? t('form.capacity_default') : t('form.capacity_by_event')}
                        >
                          <Users className="w-3 h-3" />
                          {cap}
                        </span>
                        <span className="truncate max-w-[130px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {v.location}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Schedule + live availability ===== */}
      {step === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <label className="label !mb-0">{t('form.dates.label')}</label>
            <button
              type="button"
              onClick={() => setShowAvailability(true)}
              className="btn-ghost text-xs text-primary !py-1 !px-2.5 border border-primary/20 bg-primary-50/50 rounded-md"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {t('form.venues.availability_title')}
            </button>
          </div>

          <div className="space-y-3">
            {formData.eventDates.map((slot, i) => {
              const slotAvail = availabilityMap[i] || {};
              const bad = Object.entries(slotAvail).filter(([, ok]) => !ok).map(([v]) => v);
              const complete = slot.date && slot.startTime && slot.endTime;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-colors ${
                    complete && bad.length
                      ? 'bg-rose-50/60 border-rose-300'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-700" />
                      {isAr ? `الموعد ${i + 1}` : `Slot ${i + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {complete && (formData.venues?.length ?? 0) > 0 && (
                        bad.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'جميع القاعات متاحة' : 'All venues available'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            {isAr ? `تعارض: ${bad.map(venueName).join('، ')}` : `Conflict: ${bad.join(', ')}`}
                          </span>
                        )
                      )}
                      {formData.eventDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(i)}
                          className="text-rose-500 hover:bg-rose-100 rounded-md w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('form.dates.date')}</label>
                      <input
                        type="date"
                        className="input-field !py-2"
                        value={slot.date || ''}
                        onChange={(e) => updateSlot(i, { date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('form.dates.from_time')}</label>
                      <input
                        type="time"
                        className="input-field !py-2"
                        value={slot.startTime || ''}
                        onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('form.dates.to_time')}</label>
                      <input
                        type="time"
                        className="input-field !py-2"
                        value={slot.endTime || ''}
                        onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addSlot} className="btn-ghost text-sm text-primary">
            + {t('form.dates.add_slot')}
          </button>
        </div>
      )}

      {/* ===== STEP 3: Requester ===== */}
      {step === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <label className="label">{t('form.requesterType')}</label>
            <div className="grid grid-cols-2 gap-3">
              {(['internal', 'external'] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.requesterType === type
                      ? 'border-primary bg-primary-50 text-primary-800'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="requesterType"
                    className="accent-primary"
                    checked={formData.requesterType === type}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        requesterType: type,
                        externalEntity: '',
                        requesterDepartment: '',
                      })
                    }
                  />
                  <span className="text-sm font-medium">
                    {type === 'internal' ? t('form.internal') : t('form.external')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {formData.requesterType === 'internal' ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">{t('form.college')}</label>
                <select
                  className="input-field"
                  value={collegeId}
                  onChange={(e) => {
                    setCollegeId(e.target.value);
                    setDeptName('');
                  }}
                >
                  <option value="">{t('form.select')}</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.name : c.nameEn || c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('form.dept')}</label>
                <select
                  className="input-field"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  disabled={!collegeId}
                >
                  <option value="">{t('form.select')}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {isAr ? d.name : d.nameEn || d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="label">{t('form.externalEntity')}</label>
              <select
                className="input-field"
                value={formData.externalEntity || ''}
                onChange={(e) => setFormData({ ...formData, externalEntity: e.target.value })}
              >
                <option value="">{t('form.select')}</option>
                {externalEntities.map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('form.name')}</label>
              <input
                type="text"
                className="input-field"
                value={formData.requesterName}
                onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t('form.email')}</label>
              <input
                type="email"
                className="input-field"
                value={formData.requesterEmail}
                onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="label">{t('form.phone')}</label>
            <input
              type="tel"
              className="input-field"
              value={formData.requesterPhone || ''}
              onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
              dir="ltr"
              placeholder="05xxxxxxxx"
            />
          </div>

          <div>
            <label className="label">{t('form.notes')}</label>
            <textarea
              className="input-field min-h-[70px]"
              value={formData.additionalNotes || ''}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ===== STEP 4: Review ===== */}
      {step === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div className="rounded-2xl border border-[var(--line)] overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-ink to-primary-800 text-white">
              <div className="text-xs text-secondary-300 font-semibold mb-0.5">
                {isAr ? 'ملخص طلب الحجز' : 'Booking Request Summary'}
              </div>
              <h3 className="font-bold text-lg">{formData.title || '—'}</h3>
              <div className="text-xs text-white/70 mt-1">
                {formData.venueEventType
                  ? isAr
                    ? EVENT_TYPES.find((e) => e.id === formData.venueEventType)?.ar
                    : EVENT_TYPES.find((e) => e.id === formData.venueEventType)?.en
                  : ''}
              </div>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  {isAr ? 'القاعات المختارة' : 'Selected Venues'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(formData.venues || []).map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-800 border border-primary/20 px-2.5 py-1 rounded-lg font-semibold"
                    >
                      <Building2 className="w-3 h-3" />
                      {venueName(v)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  {isAr ? 'المواعيد' : 'Schedule'}
                </div>
                <div className="space-y-1">
                  {formData.eventDates.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink-700">
                      <CalendarDays className="w-3.5 h-3.5 text-primary-700" />
                      {formatDate(s.date, language)}
                      <span dir="ltr" className="font-mono text-slate-500">
                        {s.startTime} - {s.endTime}
                      </span>
                      <span className="text-slate-400">
                        ({formatTime(s.startTime)} - {formatTime(s.endTime)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-400">{t('form.name')}: </span>
                  <span className="font-semibold">{formData.requesterName || '—'}</span>
                </div>
                <div className="text-xs" dir="ltr">
                  <span className="text-slate-400">{t('form.email')}: </span>
                  <span className="font-semibold">{formData.requesterEmail || '—'}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">{t('table.department')}: </span>
                  <span className="font-semibold">
                    {formData.requesterType === 'external'
                      ? formData.externalEntity || '—'
                      : deptName || '—'}
                  </span>
                </div>
                <div className="text-xs" dir="ltr">
                  <span className="text-slate-400">{t('form.phone')}: </span>
                  <span className="font-semibold">{formData.requesterPhone || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {isAr
                ? 'سيتم إرسال الطلب بحالة "قيد الانتظار" لاعتماده من مدير مركز مؤتمرات وأعمال الدرعية، ويصلك إشعار عند الاعتماد.'
                : 'The request will be submitted as pending for approval by the Diriyah Center manager.'}
            </span>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('form.submitting')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isAr ? 'إرسال طلب الحجز للاعتماد' : 'Submit Booking Request'}
              </>
            )}
          </button>
        </div>
      )}

      {/* ===== Nav buttons ===== */}
      {step < STEPS.length - 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="btn-ghost text-sm disabled:opacity-30 flex items-center gap-1.5"
          >
            <ArrowBack className="w-4 h-4" />
            {isAr ? 'السابق' : 'Back'}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="btn-primary text-sm !py-2.5 !px-6 font-bold flex items-center gap-1.5"
          >
            {isAr ? 'التالي' : 'Next'}
            <ArrowFwd className="w-4 h-4" />
          </button>
        </div>
      )}
      {step === STEPS.length - 1 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={goBack}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <ArrowBack className="w-4 h-4" />
            {isAr ? 'السابق' : 'Back'}
          </button>
        </div>
      )}

      <VenueAvailabilityPopup
        open={showAvailability}
        onClose={() => setShowAvailability(false)}
        requests={allRequests}
        selectedVenues={formData.venues || []}
      />
    </div>
  );
}

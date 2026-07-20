import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Loader2 } from 'lucide-react';
import type {
  ServiceType,
  ServiceFormData,
  DateRange,
  VenueType,
  College,
  ExternalEntity,
  ServiceRequest,
} from '../types';
import TheaterForm from './forms/TheaterForm';
import CoverageForm from './forms/CoverageForm';
import PhotographyForm from './forms/PhotographyForm';
import DesignForm from './forms/DesignForm';
import SocialForm from './forms/SocialForm';
import OtherForm from './forms/OtherForm';
import TranslationForm from './forms/TranslationForm';
import NewsForm from './forms/NewsForm';
import WorkshopForm from './forms/WorkshopForm';
import EventForm from './forms/EventForm';
import DelegationForm from './forms/DelegationForm';
import { useLanguage } from '../context/LanguageContext';
import { addStoredRequest, getStoredRequests } from '../utils/storage';
import { generateTrackingCode } from '../data/defaults';
import { normalizeDateRange, rangesOverlap } from '../utils/dateUtils';

interface ServiceFormProps {
  initialService?: ServiceType | null;
  initialVenue?: string;
  onSubmitSuccess?: () => void;
  colleges?: College[];
  externalEntities?: ExternalEntity[];
}

const emptySlot = (): DateRange => ({ date: '', startTime: '09:00', endTime: '12:00' });

const initialFormData = (
  serviceType?: ServiceType | null,
  venue?: string
): ServiceFormData => ({
  serviceType: serviceType || 'theater',
  venues: venue ? ([venue] as VenueType[]) : serviceType === 'theater' ? [] : undefined,
  title: '',
  description: '',
  eventDates: [emptySlot()],
  requesterName: '',
  requesterEmail: '',
  requesterPhone: '',
  requesterDepartment: '',
  requesterType: 'internal',
  externalEntity: '',
  additionalNotes: '',
});

export default function ServiceForm({
  initialService,
  initialVenue,
  onSubmitSuccess,
  colleges = [],
  externalEntities = [],
}: ServiceFormProps) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<ServiceFormData>(
    initialFormData(initialService, initialVenue)
  );
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [deptName, setDeptName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAllRequests(getStoredRequests());
  }, []);

  useEffect(() => {
    setFormData(initialFormData(initialService, initialVenue));
    setSubmitted(false);
    setTrackingCode('');
    setError('');
    setCollegeId('');
    setDeptName('');
  }, [initialService, initialVenue]);

  const departments = useMemo(() => {
    const col = colleges.find((c) => c.id === collegeId);
    return (col?.departments || []).filter((d) => d.enabled);
  }, [colleges, collegeId]);

  const requiresVenue = formData.serviceType === 'theater';

  const isVenueAvailable = (venue: VenueType, range: DateRange) => {
    const slot = normalizeDateRange(range);
    if (!slot.date || !slot.startTime || !slot.endTime) return true;
    for (const req of allRequests) {
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      if (!req.venues?.includes(venue)) continue;
      for (const raw of req.eventDates || []) {
        const existing = normalizeDateRange(raw);
        if (rangesOverlap(slot, existing)) return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (requiresVenue) {
      if (!formData.venues?.length) {
        setError(t('form.venues.required'));
        return;
      }
      for (const venue of formData.venues) {
        for (const dr of formData.eventDates) {
          if (!isVenueAvailable(venue, dr)) {
            setError(`${t(`venues.${venue}`)} — ${t('form.venues.unavailable')}`);
            return;
          }
        }
      }
    }

    if (!formData.title.trim() || !formData.requesterName.trim() || !formData.requesterEmail.trim()) {
      setError(t('form.required'));
      return;
    }

    if (formData.requesterType === 'internal' && (!collegeId || !deptName)) {
      setError(t('form.required'));
      return;
    }
    if (formData.requesterType === 'external' && !formData.externalEntity) {
      setError(t('form.required'));
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));

    const code = generateTrackingCode();
    const now = new Date().toISOString();
    const newRequest: ServiceRequest = {
      id: Date.now().toString(),
      trackingCode: code,
      serviceType: formData.serviceType,
      title: formData.title.trim(),
      description: formData.description.trim(),
      requestDate: now.split('T')[0],
      eventDates: formData.eventDates.map(normalizeDateRange),
      venues: formData.venues,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: language === 'ar' ? 'النظام' : 'System',
          changedAt: now,
          note: language === 'ar' ? 'تم استلام الطلب' : 'Request received',
        },
      ],
      requesterName: formData.requesterName.trim(),
      requesterEmail: formData.requesterEmail.trim(),
      requesterPhone: formData.requesterPhone?.trim(),
      requesterDepartment:
        formData.requesterType === 'internal' ? `${collegeId}:${deptName}` : '',
      requesterType: formData.requesterType,
      externalEntity: formData.externalEntity,
      additionalNotes: formData.additionalNotes?.trim(),
    };

    addStoredRequest(newRequest);
    setAllRequests(getStoredRequests());
    setTrackingCode(code);
    setSubmitted(true);
    setSubmitting(false);
    onSubmitSuccess?.();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4 animate-slideUp">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-emerald-800 mb-2">{t('form.success.title')}</h3>
        <p className="text-slate-500 mb-5">{t('form.success.message')}</p>
        <div className="inline-flex flex-col items-center gap-2 bg-primary-50 border border-primary-100 rounded-2xl px-6 py-4 mb-6">
          <span className="text-xs font-semibold text-primary-600">{t('form.success.tracking')}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-primary-900 tracking-wider" dir="ltr">
              {trackingCode}
            </span>
            <button type="button" onClick={copyCode} className="btn-ghost p-2" title="copy">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copied && <span className="text-xs text-emerald-600">✓</span>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/track?code=${trackingCode}`} className="btn-primary">
            {t('form.success.track')}
          </Link>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setFormData(initialFormData(initialService, initialVenue));
              setSubmitted(false);
              setTrackingCode('');
              setCollegeId('');
              setDeptName('');
            }}
          >
            {t('form.success.new')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Service-specific fields */}
      {formData.serviceType === 'theater' && (
        <TheaterForm
          formData={formData}
          setFormData={setFormData}
          allRequests={allRequests}
          showAvailability={showAvailability}
          setShowAvailability={setShowAvailability}
        />
      )}
      {formData.serviceType === 'coverage' && (
        <CoverageForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'photography' && (
        <PhotographyForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'design' && (
        <DesignForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'social' && (
        <SocialForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'other' && (
        <OtherForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'translation' && (
        <TranslationForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'news' && (
        <NewsForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'workshop' && (
        <WorkshopForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'event' && (
        <EventForm formData={formData} setFormData={setFormData} />
      )}
      {formData.serviceType === 'delegation' && (
        <DelegationForm formData={formData} setFormData={setFormData} />
      )}

      {/* Common fields when service forms don't already provide title */}
      {![
        'coverage',
        'photography',
        'design',
        'social',
        'other',
        'translation',
        'news',
        'workshop',
        'event',
        'delegation',
      ].includes(formData.serviceType) && (
        <>
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
              className="input-field min-h-[90px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
        </>
      )}

      {/* Requester type */}
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
              required
            >
              <option value="">{t('form.select')}</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'ar' ? c.name : c.nameEn || c.name}
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
              required
              disabled={!collegeId}
            >
              <option value="">{t('form.select')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {language === 'ar' ? d.name : d.nameEn || d.name}
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
            required
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
            required
          />
        </div>
        <div>
          <label className="label">{t('form.email')}</label>
          <input
            type="email"
            className="input-field"
            value={formData.requesterEmail}
            onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
            required
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

      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('form.submitting')}
          </>
        ) : (
          t('form.submit')
        )}
      </button>
    </form>
  );
}

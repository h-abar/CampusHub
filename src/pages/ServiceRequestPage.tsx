import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Theater,
  Camera,
  Video,
  PenTool,
  Share2,
  Languages,
  Newspaper,
  Presentation,
  CalendarDays,
  Users,
  MoreHorizontal,
  LogIn,
  Search,
} from 'lucide-react';
import ServiceForm from '../components/ServiceForm';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSystemSettings } from '../utils/storage';
import type { ServiceType, SystemSettings } from '../types';

const SERVICE_ICONS: Record<string, React.ElementType> = {
  theater: Theater,
  coverage: Video,
  photography: Camera,
  design: PenTool,
  social: Share2,
  translation: Languages,
  news: Newspaper,
  workshop: Presentation,
  event: CalendarDays,
  delegation: Users,
  other: MoreHorizontal,
};

const SERVICE_IMAGES: Record<string, string> = {
  theater: '/img/service-theater.jpg',
  coverage: '/img/service-coverage.jpg',
  photography: '/img/service-photography.jpg',
  design: '/img/service-design.jpg',
  social: '/img/service-social.jpg',
  translation: '/img/service-translation.jpg',
  news: '/img/service-news.jpg',
  workshop: '/img/service-workshop.jpg',
  event: '/img/service-event.jpg',
  delegation: '/img/service-delegation.jpg',
  other: '/img/service-other.jpg',
};



export default function ServiceRequestPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [params] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [preselectedVenue, setPreselectedVenue] = useState<string | undefined>();
  const [settings, setSettings] = useState<SystemSettings>(() => getSystemSettings());

  useEffect(() => {
    setSettings(getSystemSettings());
  }, [isModalOpen]);

  useEffect(() => {
    const svc = params.get('service');
    const venue = params.get('venue') || undefined;
    if (svc) {
      setSelectedService(svc);
      setPreselectedVenue(venue);
      setIsModalOpen(true);
    }
  }, [params]);

  const enabledServices = useMemo(
    () => (settings.services || []).filter((s) => s.enabled),
    [settings]
  );
  const colleges = useMemo(
    () => (settings.colleges || []).filter((c) => c.enabled),
    [settings]
  );
  const externalEntities = useMemo(
    () => (settings.externalEntities || []).filter((e) => e.enabled),
    [settings]
  );

  const openService = (key: string) => {
    setSelectedService(key);
    setPreselectedVenue(undefined);
    setIsModalOpen(true);
  };

  const serviceTitle = (s: { key: string; name: string; nameEn?: string }) =>
    language === 'ar' ? s.name : s.nameEn || s.name;

  const serviceDesc = (s: { description?: string; descriptionEn?: string }) =>
    language === 'ar' ? s.description : s.descriptionEn || s.description;

  return (
    <div className="animate-fadeIn">
      {/* Soft page banner */}
      <div
        className="relative border-b border-[var(--line)]"
        style={{
          backgroundImage: "url('/img/wall.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/90" />
        <div className="page-shell relative !py-8 !pb-6">
          <div className="title-rule">
            <h1 className="section-title !mb-0">{t('services.title')}</h1>
          </div>
          <p className="section-subtitle max-w-2xl">{t('services.subtitle')}</p>
        </div>
      </div>

      <div className="page-shell !pt-8">
      {enabledServices.length === 0 ? (
        <div className="card-static text-center text-slate-500">{t('services.empty')}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {enabledServices.map((serv) => {
            const Icon = SERVICE_ICONS[serv.key] || MoreHorizontal;
            const img = SERVICE_IMAGES[serv.key] || '/img/campus-1.jpg';
            return (
              <button key={serv.key} onClick={() => openService(serv.key)} className="service-card group !p-0 overflow-hidden">
                <div className="h-32 relative overflow-hidden">
                  <img
                    src={img}
                    alt={serviceTitle(serv)}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(11,44,53,0.85) 0%, rgba(11,44,53,0.2) 100%)',
                    }}
                  />
                  <div className="absolute bottom-3 start-3 w-9 h-9 bg-white/95 flex items-center justify-center text-primary border border-white/40 transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="h-1 w-full bg-primary group-hover:bg-secondary transition-colors" />
                <div className="p-4 w-full text-start">
                  <div className="text-base font-semibold text-ink mb-1">{serviceTitle(serv)}</div>
                  {serv.description && (
                    <p className="text-xs text-ink-500 leading-6 font-naskh line-clamp-2">
                      {serviceDesc(serv)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/track"
          className="card flex items-center gap-4 hover:border-primary !p-5"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-800">{t('nav.track')}</div>
            <div className="text-sm text-slate-500">{t('track.subtitle')}</div>
          </div>
        </Link>

        {!user && (
          <Link to="/login" className="card flex items-center gap-4 hover:border-secondary !p-5">
            <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-700 flex items-center justify-center">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-800">{t('auth.admin.question')}</div>
              <div className="text-sm text-slate-500">{t('auth.admin.instruction')}</div>
            </div>
          </Link>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }}
        title={
          selectedService
            ? serviceTitle(
                enabledServices.find((s) => s.key === selectedService) || {
                  key: selectedService,
                  name: selectedService,
                }
              )
            : ''
        }
        size="lg"
      >
        {selectedService && (
          <ServiceForm
            initialService={selectedService}
            initialVenue={preselectedVenue}
            colleges={colleges}
            externalEntities={externalEntities}
            onSubmitSuccess={() => {
              /* keep modal open to show success + tracking */
            }}
          />
        )}
      </Modal>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ClipboardList,
  Palette,
  Theater,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HeroSlider from '../components/HeroSlider';

const FEATURE_IMAGES = [
  '/img/service-theater.jpg',
  '/img/service-coverage.jpg',
  '/img/service-design.jpg',
  '/img/finance-analytics.jpg',
];

export default function LandingPage() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const features = [
    {
      icon: Theater,
      title: t('landing.features.venues'),
      desc: t('landing.features.venues.desc'),
      image: FEATURE_IMAGES[0],
    },
    {
      icon: Camera,
      title: t('landing.features.events'),
      desc: t('landing.features.events.desc'),
      image: FEATURE_IMAGES[1],
    },
    {
      icon: Palette,
      title: t('landing.features.design'),
      desc: t('landing.features.design.desc'),
      image: FEATURE_IMAGES[2],
    },
    {
      icon: ClipboardList,
      title: t('landing.features.tracking'),
      desc: t('landing.features.tracking.desc'),
      image: FEATURE_IMAGES[3],
    },
  ];

  const steps = [
    { n: '01', title: t('landing.how.step1'), desc: t('landing.how.step1.desc') },
    { n: '02', title: t('landing.how.step2'), desc: t('landing.how.step2.desc') },
    { n: '03', title: t('landing.how.step3'), desc: t('landing.how.step3.desc') },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Hero 3D slider */}
      <HeroSlider />

      {/* Features with photos */}
      <section className="page-shell">
        <div className="mb-10">
          <div className="title-rule">
            <h2 className="section-title !mb-0">{t('landing.features.title')}</h2>
          </div>
          <p className="section-subtitle max-w-2xl">{t('landing.features.subtitle')}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="card group relative overflow-hidden !p-0">
              <div className="h-32 relative overflow-hidden">
                <img
                  src={f.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(11,44,53,0.85) 0%, rgba(11,44,53,0.2) 100%)',
                  }}
                />
                <div className="absolute bottom-3 start-3 w-9 h-9 bg-white/95 flex items-center justify-center text-primary border border-white/40">
                  <f.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="h-1 w-full bg-primary group-hover:bg-secondary transition-colors" />
              <div className="p-4">
                <h3 className="text-base font-semibold text-ink mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-500 leading-7 font-naskh">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — with light side photo */}
      <section className="bg-white border-y border-[var(--line)]">
        <div className="page-shell">
          <div className="grid lg:grid-cols-5 gap-8 items-stretch">
            <div className="lg:col-span-2 relative min-h-[260px] overflow-hidden border border-[var(--line)]">
              <img
                src="/img/business-students.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(11,44,53,0.8) 0%, transparent 55%)',
                }}
              />
              <div className="absolute bottom-0 start-0 end-0 p-5">
                <div className="text-secondary-300 text-xs mb-1 flex items-center gap-2">
                  <span className="geo-diamond" />
                  {t('app.university')}
                </div>
                <div className="text-white font-semibold">{t('landing.how.title')}</div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-6">
                <div className="title-rule">
                  <h2 className="section-title !mb-0">{t('landing.how.title')}</h2>
                </div>
              </div>
              <div className="grid gap-0 border border-[var(--line)]">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={`p-5 md:p-6 bg-white flex gap-4 items-start ${
                      i < steps.length - 1 ? 'border-b border-[var(--line)]' : ''
                    }`}
                  >
                    <div className="text-2xl font-semibold text-primary/25 leading-none min-w-[2.5rem]">
                      {s.n}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ink mb-1">{s.title}</h3>
                      <p className="text-sm text-ink-500 leading-7 font-naskh">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA with background image */}
      <section className="page-shell">
        <div className="relative overflow-hidden border border-[var(--line)] min-h-[240px]">
          <img
            src="/img/campus-2.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(11,44,53,0.95) 0%, rgba(11,44,53,0.88) 55%, rgba(0,173,202,0.45) 100%)',
            }}
          />
          <div className="absolute top-0 start-0 w-16 h-16 border-s border-t border-secondary/40" />
          <div className="absolute bottom-0 end-0 w-16 h-16 border-e border-b border-primary/30" />
          <div className="relative p-8 md:p-12 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="geo-diamond" />
              <span className="text-secondary-300 text-xs font-medium">{t('app.university')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
              {t('landing.cta.title')}
            </h2>
            <p className="text-white/75 text-base mb-6 font-naskh leading-8">
              {t('landing.cta.subtitle')}
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-600 text-white font-medium px-6 py-3 rounded-md transition-colors"
            >
              {t('landing.cta.button')}
              <Arrow className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

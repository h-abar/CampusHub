import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Landmark, Globe, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * محاور الاتصال المؤسسي الثلاثة:
 * 1. إدارة الاتصال المؤسسي
 * 2. مركز مؤتمرات وأعمال الدرعية
 * 3. إدارة الموقع الإلكتروني لجامعة المعرفة
 */
export const PILLARS = [
  {
    id: 'comms',
    icon: Megaphone,
    nameKey: 'pillar.comms.name',
    descKey: 'pillar.comms.desc',
    color: '#00697B', // primary-700
    bg: '#E8F8FB', // primary-50
    links: [
      { to: '/services', labelKey: 'pillar.comms.services' },
      { to: '/track', labelKey: 'pillar.comms.track' },
    ],
  },
  {
    id: 'diriyah',
    icon: Landmark,
    nameKey: 'pillar.diriyah.name',
    descKey: 'pillar.diriyah.desc',
    color: '#7A6041', // secondary-700
    bg: '#F8F4EE', // secondary-50
    links: [
      { to: '/diriyah-center', labelKey: 'pillar.diriyah.about' },
      { to: '/venues', labelKey: 'pillar.diriyah.venues' },
    ],
  },
  {
    id: 'web',
    icon: Globe,
    nameKey: 'pillar.web.name',
    descKey: 'pillar.web.desc',
    color: '#1A3038', // ink-700
    bg: '#F2F5F6', // ink-50
    links: [
      { to: '/services?service=news', labelKey: 'pillar.web.news' },
      { to: '/dashboard', labelKey: 'pillar.web.dashboard' },
    ],
  },
] as const;

/** شريط المحاور الثلاثة — يظهر بشكل دائم أسفل الهيدر */
export function PillarsStrip() {
  const { t } = useLanguage();

  return (
    <div className="hidden md:block bg-white border-b border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch justify-center divide-x divide-[var(--line)] rtl:divide-x-reverse">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.id}
                href={`#${p.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.querySelector(`a[href*='${p.links[0].to}']`) as HTMLAnchorElement;
                  if (p.links[0].to.startsWith('/services?')) {
                    window.location.href = p.links[0].to;
                  } else if (target) {
                    target.click();
                  }
                }}
                className="group flex items-center gap-2.5 px-6 py-2.5 transition-colors hover:bg-[var(--ink-50)]"
                title={t(p.descKey)}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: p.bg, color: p.color }}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[13px] font-semibold text-ink-700 group-hover:text-ink whitespace-nowrap">
                  {t(p.nameKey)}
                </span>
                <span
                  className="w-1.5 h-1.5 rotate-45 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: p.color }}
                />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** قائمة المحاور المنسدلة (Mega Menu) */
export function PillarsMegaMenu() {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative px-3 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1 ${
          open ? 'text-primary-700' : 'text-ink-700 hover:text-primary-700'
        }`}
      >
        <span className="relative inline-block">
          {t('pillars.menu')}
          <span className="absolute -bottom-1 start-0 end-0 h-0.5 bg-secondary" />
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-[min(92vw,780px)] z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden">
            {/* رأس القائمة */}
            <div className="px-5 py-3.5 bg-gradient-to-l from-ink via-ink-800 to-primary-900 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{t('pillars.title')}</div>
                <div className="text-[11px] text-white/75 mt-0.5">{t('pillars.subtitle')}</div>
              </div>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-secondary-300 border border-secondary-500/40 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-400" />
                {isAr ? '٣ محاور' : '3 Pillars'}
              </span>
            </div>

            {/* البطاقات */}
            <div className="grid sm:grid-cols-3 gap-0 divide-x divide-[var(--line)] rtl:divide-x-reverse">
              {PILLARS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-[var(--ink-50)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: p.bg, color: p.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <span
                        className="text-[10px] font-bold tracking-wider"
                        style={{ color: p.color }}
                      >
                        {isAr ? `المحور ${['الأول', 'الثاني', 'الثالث'][idx]}` : `Pillar ${idx + 1}`}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-ink leading-snug">
                        {t(p.nameKey)}
                      </div>
                      <p className="text-[11px] text-ink-500 leading-relaxed mt-1 font-naskh">
                        {t(p.descKey)}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-col gap-1.5 pt-1">
                      {p.links.map((l) => (
                        <Link
                          key={l.to}
                          to={l.to}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center justify-between gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors hover:shadow-xs"
                          style={{ borderColor: p.bg, color: p.color, backgroundColor: '#fff' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = p.bg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff';
                          }}
                        >
                          {t(l.labelKey)}
                          <Arrow className="w-3.5 h-3.5" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

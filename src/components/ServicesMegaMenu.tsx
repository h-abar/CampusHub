import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Megaphone,
  Camera,
  Palette,
  Newspaper,
  FileText,
  Search,
  ClipboardList,
  History,
  Activity,
  Users,
  Building2,
  CalendarDays,
  Mail,
  LayoutGrid,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MenuItem {
  labelKey: string;
  to: string;
  icon: typeof FileText;
  external?: boolean;
}

interface MenuGroup {
  id: string;
  icon: typeof Megaphone;
  titleKey: string;
  descKey: string;
  items: MenuItem[];
}

/** أقسام مركز خدمات إدارة الاتصال المؤسسي */
export const SERVICE_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'media',
    icon: Megaphone,
    titleKey: 'svcmm.media.title',
    descKey: 'svcmm.media.desc',
    items: [
      { labelKey: 'svcmm.media.request', to: '/services', icon: FileText },
      { labelKey: 'svcmm.media.coverage', to: '/services?service=coverage', icon: Megaphone },
      { labelKey: 'svcmm.media.photography', to: '/services?service=photography', icon: Camera },
      { labelKey: 'svcmm.media.design', to: '/services?service=design', icon: Palette },
      { labelKey: 'svcmm.media.publishing', to: '/services?service=news', icon: Newspaper },
    ],
  },
  {
    id: 'requests',
    icon: ClipboardList,
    titleKey: 'svcmm.requests.title',
    descKey: 'svcmm.requests.desc',
    items: [
      { labelKey: 'svcmm.requests.submit', to: '/services', icon: FileText },
      { labelKey: 'svcmm.requests.track', to: '/track', icon: Search },
      { labelKey: 'svcmm.requests.history', to: '/dashboard', icon: History },
      { labelKey: 'svcmm.requests.status', to: '/track', icon: Activity },
    ],
  },
  {
    id: 'comms',
    icon: Users,
    titleKey: 'svcmm.comms.title',
    descKey: 'svcmm.comms.desc',
    items: [
      { labelKey: 'svcmm.comms.pr', to: '/services?service=delegation', icon: Users },
      { labelKey: 'svcmm.comms.corporate', to: '/services', icon: Building2 },
      { labelKey: 'svcmm.comms.events', to: '/services?service=event', icon: CalendarDays },
      {
        labelKey: 'svcmm.comms.contact',
        to: 'mailto:pr@um.edu.sa',
        icon: Mail,
        external: true,
      },
    ],
  },
];

/** زر القائمة + لوحة Mega Menu لسطح المكتب */
export default function ServicesMegaMenu({ activeRoute }: { activeRoute: boolean }) {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
  };

  const openMenu = useCallback(() => {
    clearTimers();
    setOpen(true);
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), 60);
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }, []);

  const toggle = () => {
    clearTimers();
    setOpen((v) => !v);
  };

  const closeAndFocus = useCallback(() => {
    clearTimers();
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAndFocus();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, closeAndFocus]);

  useEffect(() => () => clearTimers(), []);

  return (
    <>
      {/* الزر المشغّل */}
      <div onMouseEnter={scheduleOpen} onMouseLeave={scheduleClose} className="inline-flex">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls="services-mega-menu"
          className={`relative px-3 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1 whitespace-nowrap ${
            open || activeRoute ? 'text-primary-700' : 'text-ink-700 hover:text-primary-700'
          }`}
        >
          <span className="relative inline-block">
            {t('nav.services')}
            {(open || activeRoute) && (
              <span className="absolute -bottom-1 start-0 end-0 h-0.5 bg-secondary" />
            )}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* لوحة Mega Menu */}
      {open && (
        <div
          id="services-mega-menu"
          ref={panelRef}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          className="absolute inset-x-0 top-full z-50 animate-megaIn"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
            <div className="bg-white rounded-xl shadow-2xl border border-[var(--line)] overflow-hidden">
              {/* رأس اللوحة */}
              <div className="px-6 py-3.5 border-b border-[var(--line)] bg-gradient-to-l from-primary-50/70 via-white to-secondary-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-primary-700 text-white flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink truncate">{t('nav.services')}</div>
                    <div className="text-[11px] text-ink-400 truncate">{t('svcmm.tagline')}</div>
                  </div>
                </div>
                <span className="hidden sm:inline-flex text-[10px] font-bold text-primary-800 bg-primary-50 border border-primary-100 rounded-full px-2.5 py-1 shrink-0">
                  {t('svcmm.badge')}
                </span>
              </div>

              {/* الأقسام الثلاثة */}
              <div className="grid md:grid-cols-3 md:divide-x md:divide-[var(--line)]">
                {SERVICE_MENU_GROUPS.map((g) => {
                  const Icon = g.icon;
                  return (
                    <div key={g.id} className="p-5">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <h3 className="text-sm font-bold text-ink">{t(g.titleKey)}</h3>
                      </div>
                      <p className="text-[11.5px] text-ink-500 leading-6 mb-3 font-naskh">
                        {t(g.descKey)}
                      </p>
                      <ul className="space-y-0.5">
                        {g.items.map((item) => {
                          const ItemIcon = item.icon;
                          const content = (
                            <>
                              <ItemIcon className="w-3.5 h-3.5 text-ink-300 group-hover/item:text-primary-700 transition-colors shrink-0" />
                              <span className="truncate">{t(item.labelKey)}</span>
                            </>
                          );
                          const cls =
                            'group/item flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-ink-600 hover:bg-primary-50 hover:text-primary-800 transition-colors';
                          return (
                            <li key={item.labelKey}>
                              {item.external ? (
                                <a href={item.to} className={cls}>
                                  {content}
                                </a>
                              ) : (
                                <Link to={item.to} onClick={() => setOpen(false)} className={cls}>
                                  {content}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* شريط المساعدة */}
              <div className="px-6 py-3 bg-ink flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs text-white/85">{t('svcmm.help.title')}</span>
                <a
                  href="mailto:pr@um.edu.sa"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary-300 hover:text-secondary-200 transition-colors"
                >
                  {t('svcmm.help.cta')}
                  <Arrow className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Accordion الجوال — بديل الـMega Menu على الشاشات الصغيرة */
export function ServicesMobileAccordion({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--line)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
          open ? 'bg-primary-50 text-primary-800' : 'bg-[var(--ink-50)] text-ink-700'
        }`}
      >
        <span>{t('nav.services')}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="p-2 space-y-2.5 animate-fadeIn bg-white">
          {SERVICE_MENU_GROUPS.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.id}>
                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-ink-400 uppercase tracking-wide">
                  <Icon className="w-3.5 h-3.5" />
                  {t(g.titleKey)}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {g.items.map((item) => {
                    const ItemIcon = item.icon;
                    const cls =
                      'flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-ink-600 bg-[var(--ink-50)] hover:bg-primary-50 hover:text-primary-800 transition-colors text-start';
                    return item.external ? (
                      <a key={item.labelKey} href={item.to} className={cls}>
                        <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </a>
                    ) : (
                      <Link
                        key={item.labelKey}
                        to={item.to}
                        onClick={onNavigate}
                        className={cls}
                      >
                        <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

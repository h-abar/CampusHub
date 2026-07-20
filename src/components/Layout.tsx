import { Outlet, Link } from 'react-router-dom';
import { Mail, Phone, Building2 } from 'lucide-react';
import Header from './Header';
import { useLanguage } from '../context/LanguageContext';
import { ensureInitialized } from '../utils/storage';

ensureInitialized();

const LOGO = '/img/logo-um.png';

export default function Layout() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const year = new Date().getFullYear().toString();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto site-footer">
        <div
          className="h-1.5"
          style={{
            background: 'linear-gradient(to left, #00697B, #00ADCA, #B8956C)',
          }}
        />

        <div style={{ backgroundColor: '#0B2C35', color: '#ffffff' }}>
          {/* subtle campus texture */}
          <div
            className="relative"
            style={{
              backgroundImage: "url('/img/campus-2.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(11, 44, 53, 0.94)' }}
            />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={LOGO}
                      alt={t('app.university')}
                      className="h-12 w-auto"
                      style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.svg';
                      }}
                    />
                    <div
                      className="ps-3"
                      style={{ borderInlineStart: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <div className="font-semibold" style={{ color: '#ffffff' }}>
                        {t('app.title')}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {t('app.university')}
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-sm leading-7 font-naskh"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {t('footer.about.text')}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1" style={{ color: '#ffffff' }}>
                    {t('footer.links')}
                  </h4>
                  <div className="mb-4" style={{ height: 3, width: 48, backgroundColor: '#B8956C' }} />
                  <ul className="space-y-2.5 text-sm">
                    {[
                      { to: '/services', label: t('nav.services') },
                      { to: '/venues', label: t('nav.venues') },
                      { to: '/track', label: t('nav.track') },
                      { to: '/login', label: t('nav.login') },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className="inline-flex items-center gap-2 transition-colors"
                          style={{ color: 'rgba(255,255,255,0.72)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#D2BA93';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.72)';
                          }}
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 shrink-0"
                            style={{ backgroundColor: '#B8956C', transform: 'rotate(45deg)' }}
                          />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-1" style={{ color: '#ffffff' }}>
                    {t('footer.contact')}
                  </h4>
                  <div className="mb-4" style={{ height: 3, width: 48, backgroundColor: '#B8956C' }} />
                  <ul className="space-y-3 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <li className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 shrink-0" style={{ color: '#B8956C' }} />
                      <span>{t('app.university')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" style={{ color: '#B8956C' }} />
                      <a href="mailto:pr@um.edu.sa" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {t('footer.email')}
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0" style={{ color: '#B8956C' }} />
                      <span dir="ltr">{t('footer.phone')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div
                className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {t('footer.copyright').replace('{year}', year)}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 shrink-0"
                    style={{ backgroundColor: '#B8956C', transform: 'rotate(45deg)' }}
                  />
                  <span className="text-xs tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    جامعة المعرفة · Almaarefa University
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

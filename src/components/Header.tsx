import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

const LOGO = '/img/logo-um.png';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-primary-700' : 'text-ink-700 hover:text-primary-700'
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const links = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/diriyah-center', label: t('nav.diriyah') },
    { to: '/services', label: t('nav.services') },
    { to: '/venues', label: t('nav.venues') },
    { to: '/track', label: t('nav.track') },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="gov-strip">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="geo-diamond" />
            <span className="tracking-wide">{t('app.university')}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white/70">
            <span dir="ltr">pr@um.edu.sa</span>
            <span className="text-white/30">|</span>
            <span dir="ltr">920011909</span>
          </div>
        </div>
      </div>

      <div className="glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[4.25rem]">
            <Link to="/" className="flex items-center gap-3 min-w-0 group">
              <img
                src={LOGO}
                alt={t('app.university')}
                className="h-11 md:h-12 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
              <div className="hidden sm:block min-w-0 border-s border-[var(--line)] ps-3">
                <div className="text-[0.95rem] md:text-base font-semibold text-ink leading-tight truncate group-hover:text-primary-700 transition-colors">
                  {t('app.title')}
                </div>
                <div className="text-[11px] text-ink-400 mt-0.5 truncate">
                  {language === 'ar' ? 'إدارة العلاقات العامة والتسويق' : 'PR & Marketing Department'}
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
                  {({ isActive }) => (
                    <span className="relative inline-block">
                      {l.label}
                      {isActive && (
                        <span className="absolute -bottom-1 start-0 end-0 h-0.5 bg-secondary" />
                      )}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <LanguageToggle />
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/dashboard" className="btn-ghost text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Link>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 border border-[var(--line)] text-sm text-ink-600 bg-ink-50">
                    <User className="w-4 h-4 text-primary-700" />
                    <span>{user.name || user.username}</span>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost text-sm !text-red-700 hover:!bg-red-50">
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <Link to="/login" className="hidden md:inline-flex btn-primary text-sm !py-2 !px-4">
                  {t('nav.login')}
                </Link>
              )}

              <button
                className="lg:hidden p-2 rounded-md hover:bg-ink-50"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label="menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-[var(--line)] animate-fadeIn">
              <nav className="flex flex-col gap-1 pt-3">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 text-sm font-medium rounded-md ${
                        isActive ? 'bg-primary-100 text-primary-800' : 'text-ink-700 hover:bg-ink-50'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                {user ? (
                  <>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 rounded-md"
                    >
                      {t('nav.dashboard')}
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="text-start px-3 py-2.5 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      {t('nav.logout')} ({user.name || user.username})
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="btn-primary text-sm mt-2 justify-center"
                  >
                    {t('nav.login')}
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
        <div className="h-[2px] w-full bg-gradient-to-l from-transparent via-secondary to-transparent opacity-90" />
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginForm() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError(t('auth.error.invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[75vh] flex items-center justify-center py-12 px-4 animate-fadeIn"
      style={{
        backgroundImage: "url('/img/hero-university.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(11,44,53,0.92) 0%, rgba(11,44,53,0.85) 55%, rgba(0,173,202,0.35) 100%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="card-static !p-0 overflow-hidden shadow-panel">
          <div className="px-6 py-5 text-center relative bg-ink">
            <div className="absolute inset-0 hero-pattern opacity-40 pointer-events-none" />
            <div className="relative">
              <img
                src="/img/logo-um.png"
                alt=""
                className="h-12 w-auto mx-auto mb-3"
                style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
              />
              <div className="w-10 h-10 border border-secondary/50 flex items-center justify-center mx-auto mb-3 text-secondary">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('auth.login.title')}</h2>
              <p className="text-white/60 mt-1.5 text-sm font-naskh">{t('auth.login.subtitle')}</p>
            </div>
          </div>

          <div className="p-6 bg-white">
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md mb-4 text-center text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('auth.username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="label">{t('auth.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('auth.login.loading')}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {t('auth.login.submit')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 p-3 border border-[var(--line)] bg-ink-50 text-center text-sm text-ink-500">
              <p className="font-medium text-ink-600 mb-1">{t('auth.demo.credentials')}</p>
              <p className="font-mono text-primary-700" dir="ltr">
                admin / password123
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link to="/" className="text-sm text-primary hover:underline">
                {t('common.back')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

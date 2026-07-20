import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const next = language === 'ar' ? 'en' : 'ar';

  return (
    <button
      onClick={() => setLanguage(next)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold
                 border border-[var(--line)] bg-white text-ink-600
                 hover:border-primary hover:text-primary transition-colors rounded-md"
      title={next === 'ar' ? 'العربية' : 'English'}
    >
      <span className="w-1.5 h-1.5 bg-secondary rotate-45" />
      {next === 'ar' ? 'عربي' : 'EN'}
    </button>
  );
}

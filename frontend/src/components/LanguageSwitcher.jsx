import { useLanguage } from '../context/LanguageContext';

// TR / EN dil seçici. Aktif dil vurgulanır; tıklayınca dil değişir ve tercih
// localStorage'a kaydedilir (LanguageContext üzerinden).
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage();

  const base = 'px-1.5 py-0.5 text-xs font-semibold rounded transition';
  const active = 'bg-brand-600 text-white';
  const inactive = 'text-gray-500 hover:text-brand-700';

  return (
    <div className={`flex items-center gap-0.5 border border-gray-200 rounded-md p-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => setLang('tr')}
        className={`${base} ${lang === 'tr' ? active : inactive}`}
        aria-pressed={lang === 'tr'}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? active : inactive}`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Tema durumu görsel olarak <html> üzerindeki `dark` sınıfıyla sürülür; bu yüzden
// global bir context'e gerek yok — tek bir toggle bileşeni sınıfı ve localStorage'ı
// yönetir. İlk değer, sayfa yüklenirken index.html'deki inline script tarafından
// zaten uygulanmıştır; burada yalnızca mevcut duruma göre buton ikonunu gösteririz.
function getIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export default function ThemeToggle({ className = '' }) {
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((v) => !v)}
      className={`p-1.5 rounded-full text-gray-600 hover:text-brand-700 hover:bg-gray-100 transition ${className}`}
      aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
      title={isDark ? t('theme.darkTitle') : t('theme.lightTitle')}
    >
      {isDark ? (
        // Güneş ikonu — tıklayınca gündüze döner
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Ay ikonu — tıklayınca geceye geçer
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

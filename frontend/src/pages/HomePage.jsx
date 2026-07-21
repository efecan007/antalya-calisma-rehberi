import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import PlaceCard from '../components/PlaceCard';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const HIGHLIGHTS = [
    { label: t('home.highlightInternet'), icon: '📶' },
    { label: t('home.highlightQuiet'), icon: '🤫' },
    { label: t('home.highlightCoffee'), icon: '☕' },
    { label: t('home.highlightMap'), icon: '📍' },
  ];

  useEffect(() => {
    apiClient
      .get('/places/recommendations', { params: { limit: 6 } })
      .then(({ data }) => setRecommendations(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20">
        <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-3 py-1 mb-5">
          {t('home.badge')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 max-w-3xl leading-tight tracking-tight">
          {t('home.heroTitle1')}
          <br className="hidden sm:block" /> {t('home.heroTitle2')}
        </h1>
        <p className="mt-5 text-gray-600 max-w-xl">
          {t('home.heroSubtitle')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/mekanlar"
            className="bg-brand-600 text-white px-6 py-3 rounded-full font-medium shadow-card hover:bg-brand-700 hover:shadow-card-hover transition"
          >
            {t('home.explore')}
          </Link>
          <Link
            to="/harita"
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium hover:border-brand-300 hover:text-brand-700 transition"
          >
            {t('home.seeOnMap')}
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          {HIGHLIGHTS.map((h) => (
            <span key={h.label} className="flex items-center gap-1.5">
              <span aria-hidden="true">{h.icon}</span>
              {h.label}
            </span>
          ))}
        </div>
      </div>

      {!loading && recommendations.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.recommended')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

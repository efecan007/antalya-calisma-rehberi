import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import * as billingApi from '../api/billing';

const FEATURE_KEYS = [
  'featurePosts',
  'featurePhotos',
  'featureLikes',
  'featureComments',
  'featureFollow',
  'featureNotifications',
  'featureBadge',
  'featureEarlyAccess',
];

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-brand-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ProPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    billingApi.getStatus().then(setStatus).catch(() => {});
  }, [user]);

  const isPremium = status?.isPremium;
  const trialUsed = status?.trialUsed;

  async function handleStartTrial() {
    if (!user) {
      navigate('/giris');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const updated = await billingApi.startTrial();
      setStatus(updated);
    } catch (err) {
      setError(err.response?.data?.message || t('pro.trialFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        <div className="relative max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur border border-white/25 rounded-full px-3 py-1 text-xs font-medium">
            ⭐ RemoteRehber Pro
          </span>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight">RemoteRehber Pro</h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-2xl mx-auto">{t('pro.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        {/* Aktif üyelik bandı */}
        {isPremium && (
          <div className="mb-8 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-center">
            <p className="font-medium text-brand-800">
              ⭐ {t('pro.activeBanner')}
              {status?.status === 'TRIAL' && status?.trialDaysLeft != null && (
                <span> · {t('pro.trialDaysLeft', { n: status.trialDaysLeft })}</span>
              )}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Avantajlar */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">{t('pro.featuresTitle')}</h2>
            <ul className="space-y-3">
              {FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-3 text-gray-700">
                  <CheckIcon />
                  <span>{t(`pro.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fiyat kartı */}
          <div className="bg-white rounded-3xl shadow-card-hover border border-gray-100 p-7 sm:p-8">
            <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-3 py-1 text-sm font-medium">
              🎁 {t('pro.freeTrialBadge')}
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-bold text-gray-900">25 TL</span>
              <span className="text-gray-500 mb-1.5">/ {t('pro.perMonth')}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t('pro.afterTrial')}</p>

            <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600 whitespace-pre-line">
              {t('pro.fineprint')}
            </div>

            <button
              onClick={handleStartTrial}
              disabled={isPremium || submitting || (trialUsed && !isPremium)}
              className="mt-6 w-full bg-brand-600 text-white font-semibold py-3.5 rounded-full hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-default text-base"
            >
              {isPremium
                ? t('pro.alreadyPro')
                : trialUsed
                  ? t('pro.trialUsed')
                  : submitting
                    ? t('pro.starting')
                    : t('pro.startTrial')}
            </button>

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
            {!user && <p className="mt-3 text-xs text-gray-400 text-center">{t('pro.loginHint')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { regionLabel, typeLabel } from '../constants';
import RatingStars from './RatingStars';

// Sorular ve seçenekleri. Her seçeneğin `key` değeri puanlamada kullanılır,
// `label` ise çeviri anahtarıdır. 'any' (fark etmez) seçenekleri nötrdür.
const QUESTIONS = [
  {
    id: 'ambiance',
    q: 'matcher.qAmbiance',
    options: [
      { key: 'quiet', label: 'matcher.aQuiet' },
      { key: 'lively', label: 'matcher.aLively' },
      { key: 'any', label: 'matcher.aAny' },
    ],
  },
  {
    id: 'location',
    q: 'matcher.qLocation',
    options: [
      { key: 'seaside', label: 'matcher.aSeaside' },
      { key: 'city', label: 'matcher.aCity' },
      { key: 'any', label: 'matcher.aAny' },
    ],
  },
  {
    id: 'type',
    q: 'matcher.qType',
    options: [
      { key: 'CAFE', label: 'enum.placeType.CAFE' },
      { key: 'LIBRARY', label: 'enum.placeType.LIBRARY' },
      { key: 'HOTEL', label: 'enum.placeType.HOTEL' },
      { key: 'COWORKING', label: 'enum.placeType.COWORKING' },
      { key: 'any', label: 'matcher.aAny' },
    ],
  },
  {
    id: 'priority',
    q: 'matcher.qPriority',
    options: [
      { key: 'internet', label: 'matcher.aInternet' },
      { key: 'outlets', label: 'matcher.aOutlets' },
      { key: 'coffee', label: 'matcher.aCoffee' },
      { key: 'quiet', label: 'matcher.aQuietPriority' },
    ],
  },
  {
    id: 'budget',
    q: 'matcher.qBudget',
    options: [
      { key: 'low', label: 'matcher.aBudgetLow' },
      { key: 'mid', label: 'matcher.aBudgetMid' },
      { key: 'any', label: 'matcher.aAny' },
    ],
  },
];

const SEASIDE_REGIONS = ['KONYAALTI', 'LARA'];
const CITY_REGIONS = ['KALEICI', 'MURATPASA', 'KEPEZ'];

// Bir mekanı kullanıcının cevaplarına göre puanlar. `earned` kazanılan puan,
// `max` seçilen (nötr olmayan) tercihlerden gelebilecek azami puandır; ikisinin
// oranı "uyum yüzdesi" olarak gösterilir.
function scorePlace(place, answers) {
  let earned = 0;
  let max = 0;
  const ratings = place.ratings || {};

  if (answers.ambiance && answers.ambiance !== 'any') {
    max += 2;
    if (answers.ambiance === 'quiet') {
      if (place.noiseLevel === 'LOW') earned += 2;
      else if (place.noiseLevel === 'MEDIUM') earned += 1;
    } else if (answers.ambiance === 'lively') {
      if (place.noiseLevel === 'HIGH') earned += 2;
      else if (place.noiseLevel === 'MEDIUM') earned += 1;
    }
  }

  if (answers.location && answers.location !== 'any') {
    max += 2;
    if (answers.location === 'seaside' && SEASIDE_REGIONS.includes(place.region)) earned += 2;
    if (answers.location === 'city' && CITY_REGIONS.includes(place.region)) earned += 2;
  }

  if (answers.type && answers.type !== 'any') {
    max += 3;
    if (place.type === answers.type) earned += 3;
  }

  if (answers.priority) {
    max += 2;
    if (answers.priority === 'internet') {
      if ((ratings.internetSpeed ?? 0) >= 4) earned += 2;
      else if ((ratings.internetSpeed ?? 0) >= 3) earned += 1;
    } else if (answers.priority === 'outlets') {
      if (place.outletLevel === 'HIGH') earned += 2;
      else if (place.outletLevel === 'MEDIUM') earned += 1;
    } else if (answers.priority === 'coffee') {
      if ((ratings.coffeeQuality ?? 0) >= 4) earned += 2;
      else if ((ratings.coffeeQuality ?? 0) >= 3) earned += 1;
    } else if (answers.priority === 'quiet') {
      if (place.noiseLevel === 'LOW') earned += 2;
      else if (place.noiseLevel === 'MEDIUM') earned += 1;
    }
  }

  if (answers.budget && answers.budget !== 'any') {
    max += 1;
    if (answers.budget === 'low' && place.priceLevel <= 2) earned += 1;
    if (answers.budget === 'mid' && place.priceLevel >= 2 && place.priceLevel <= 3) earned += 1;
  }

  return { earned, max };
}

function pickBestMatch(places, answers) {
  let best = null;
  for (const place of places) {
    const { earned, max } = scorePlace(place, answers);
    const rating = place.ratings?.overallRating ?? 0;
    // Beraberlik puana göre çözülür; eşitse daha yüksek puanlı mekan öne çıkar.
    const isBetter =
      !best ||
      earned > best.earned ||
      (earned === best.earned && rating > (best.place.ratings?.overallRating ?? 0));
    if (isBetter) {
      const percent = max > 0 ? Math.round((earned / max) * 100) : null;
      best = { place, earned, max, percent };
    }
  }
  return best;
}

export default function PlaceMatchBubble() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'quiz' | 'loading' | 'result'
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function reset() {
    setPhase('intro');
    setStepIndex(0);
    setAnswers({});
    setResult(null);
  }

  function closePanel() {
    setOpen(false);
    reset();
  }

  async function computeResult(finalAnswers) {
    setPhase('loading');
    try {
      const { data } = await apiClient.get('/places');
      setResult(pickBestMatch(data, finalAnswers));
    } catch {
      setResult(null);
    } finally {
      setPhase('result');
    }
  }

  function selectOption(optionKey) {
    const question = QUESTIONS[stepIndex];
    const nextAnswers = { ...answers, [question.id]: optionKey };
    setAnswers(nextAnswers);

    if (stepIndex + 1 < QUESTIONS.length) {
      setStepIndex(stepIndex + 1);
    } else {
      computeResult(nextAnswers);
    }
  }

  const currentQuestion = QUESTIONS[stepIndex];

  return (
    <div className="fixed bottom-4 left-4 z-30">
      {open && (
        <div className="mb-3 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-2xl shadow-card-hover overflow-hidden">
          {/* Başlık */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">✨ {t('matcher.title')}</span>
            <button
              type="button"
              onClick={closePanel}
              aria-label={t('common.close')}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4">
            {phase === 'intro' && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-600">{t('matcher.intro')}</p>
                <button
                  type="button"
                  onClick={() => setPhase('quiz')}
                  className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition"
                >
                  {t('matcher.start')}
                </button>
              </div>
            )}

            {phase === 'quiz' && currentQuestion && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  {t('matcher.step', { current: stepIndex + 1, total: QUESTIONS.length })}
                </p>
                <p className="text-sm font-medium text-gray-900">{t(currentQuestion.q)}</p>
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => selectOption(option.key)}
                      className="w-full text-left text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 hover:border-brand-400 hover:bg-brand-50 transition"
                    >
                      {t(option.label)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === 'loading' && (
              <p className="text-sm text-gray-500 text-center py-6">{t('matcher.finding')}</p>
            )}

            {phase === 'result' && (
              <div className="space-y-3">
                {result?.place ? (
                  <>
                    <p className="text-sm font-semibold text-brand-700">
                      {result.percent != null && result.percent < 40
                        ? t('matcher.noResult')
                        : t('matcher.resultTitle')}
                    </p>
                    <Link
                      to={`/mekan/${result.place.id}`}
                      onClick={closePanel}
                      className="block border border-gray-200 rounded-xl p-3 hover:border-brand-300 hover:shadow-card transition"
                    >
                      <p className="font-medium text-gray-900">{result.place.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {typeLabel(result.place.type, t)} · {regionLabel(result.place.region)}
                      </p>
                      <div className="mt-1.5">
                        <RatingStars value={result.place.ratings?.overallRating} />
                      </div>
                      {result.percent != null && (
                        <p className="text-xs text-brand-600 font-medium mt-1.5">
                          {t('matcher.matchPercent', { percent: result.percent })}
                        </p>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={reset}
                      className="w-full text-sm text-brand-600 hover:underline"
                    >
                      {t('matcher.restart')}
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500">{t('matcher.noResult')}</p>
                    <button
                      type="button"
                      onClick={reset}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      {t('matcher.restart')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yüzen baloncuk butonu */}
      <button
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-label={t('matcher.bubbleLabel')}
        title={t('matcher.bubbleLabel')}
        className="flex items-center justify-center h-14 w-14 rounded-full bg-brand-600 text-white shadow-card-hover hover:bg-brand-700 hover:scale-105 transition"
      >
        <span className="text-2xl" aria-hidden="true">{open ? '✕' : '✨'}</span>
      </button>
    </div>
  );
}

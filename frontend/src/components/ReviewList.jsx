import { RATING_CRITERIA } from '../constants';
import { useLanguage } from '../context/LanguageContext';

export default function ReviewList({ reviews }) {
  const { t, lang } = useLanguage();
  if (!reviews.length) {
    return <p className="text-sm text-gray-500">{t('review.none')}</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-gray-900">{review.user?.name || t('review.userFallback')}</span>
            <span className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs text-gray-600 mb-2">
            {RATING_CRITERIA.map((c) => (
              <span key={c.field}>
                {t(`enum.rating.${c.field}`)}: <strong>{review[c.field]}</strong>/5
              </span>
            ))}
          </div>
          {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}

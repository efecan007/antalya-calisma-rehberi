import { useLanguage } from '../context/LanguageContext';

export default function RatingStars({ value, outOf = 5 }) {
  const { t } = useLanguage();
  if (value === null || value === undefined) {
    return <span className="text-gray-400 text-sm">{t('review.noRatingYet')}</span>;
  }

  const rounded = Math.round(value);
  return (
    <span className="text-amber-500 text-sm" title={`${value} / ${outOf}`}>
      {'★'.repeat(rounded)}
      <span className="text-gray-300">{'★'.repeat(outOf - rounded)}</span>
      <span className="text-gray-600 ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

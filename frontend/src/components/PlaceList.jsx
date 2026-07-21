import PlaceCard from './PlaceCard';
import { useLanguage } from '../context/LanguageContext';

export default function PlaceList({ places, activeId, onHover }) {
  const { t } = useLanguage();
  if (!places.length) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        {t('place.noneMatch')}
      </div>
    );
  }

  return (
    <div>
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} active={place.id === activeId} onHover={onHover} />
      ))}
    </div>
  );
}

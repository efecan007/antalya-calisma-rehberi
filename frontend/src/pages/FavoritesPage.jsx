import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import PlaceList from '../components/PlaceList';

export default function FavoritesPage() {
  const { places } = useFavorites();
  const { t } = useLanguage();

  return (
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('favorites.title')}</h1>
      <PlaceList places={places} />
    </div>
  );
}

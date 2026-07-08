import { useFavorites } from '../context/FavoritesContext';
import PlaceList from '../components/PlaceList';

export default function FavoritesPage() {
  const { places } = useFavorites();

  return (
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Favorilerim</h1>
      <PlaceList places={places} />
    </div>
  );
}

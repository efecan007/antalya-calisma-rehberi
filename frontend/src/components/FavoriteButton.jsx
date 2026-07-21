import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

export default function FavoriteButton({ placeId, className = '' }) {
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();

  if (!user) return null;

  const active = favoriteIds.has(placeId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(placeId);
      }}
      title={active ? t('favorite.remove') : t('favorite.add')}
      className={`text-lg leading-none ${active ? 'text-red-500' : 'text-gray-300 hover:text-red-400'} ${className}`}
    >
      {active ? '♥' : '♡'}
    </button>
  );
}

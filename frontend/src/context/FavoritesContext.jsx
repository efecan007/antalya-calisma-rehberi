import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [places, setPlaces] = useState([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setPlaces([]);
      return;
    }
    const { data } = await apiClient.get('/favorites');
    setPlaces(data);
    setFavoriteIds(new Set(data.map((p) => p.id)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleFavorite(placeId) {
    if (!user) return;
    if (favoriteIds.has(placeId)) {
      await apiClient.delete(`/favorites/${placeId}`);
    } else {
      await apiClient.post(`/favorites/${placeId}`);
    }
    await refresh();
  }

  return (
    <FavoritesContext.Provider value={{ favoriteIds, places, toggleFavorite, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

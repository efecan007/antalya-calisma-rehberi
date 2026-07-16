import { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';
import FilterBar from '../components/FilterBar';
import PlaceList from '../components/PlaceList';
import MapView from '../components/MapView';
import useGeolocation from '../hooks/useGeolocation';
import { distanceKm, isOpenNow } from '../lib/geo';

const DEFAULT_FILTERS = {
  search: '',
  region: '',
  type: '',
  minRating: '',
  minInternetSpeed: '',
  noiseLevel: '',
  outletLevel: '',
  sort: '',
};

export default function PlaceListPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [nearbyMode, setNearbyMode] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const { coords, error: geoError, loading: geoLoading, request: requestLocation } = useGeolocation();

  useEffect(() => {
    const { sort, ...rest } = filters;
    const params = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));
    if (sort) {
      const [sortBy, sortOrder] = sort.split('-');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      apiClient
        .get('/places', { params })
        .then(({ data }) => setPlaces(data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  function toggleNearby() {
    if (!nearbyMode && !coords) requestLocation();
    setNearbyMode((v) => !v);
  }

  const visiblePlaces = useMemo(() => {
    let result = places.map((place) =>
      coords ? { ...place, distanceKm: distanceKm(coords, place) } : place
    );

    if (openNowOnly) {
      result = result.filter((place) => isOpenNow(place.openTime, place.closeTime));
    }

    if (nearbyMode && coords) {
      result = [...result].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return result;
  }, [places, coords, nearbyMode, openNowOnly]);

  return (
    <div className="h-full flex flex-col">
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={toggleNearby}
          disabled={geoLoading}
          className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
            nearbyMode ? 'border-brand-400 text-brand-700 bg-brand-50' : 'border-gray-200 text-gray-700'
          }`}
        >
          📍 {geoLoading ? 'Konum alınıyor...' : 'Bana En Yakın Mekanlar'}
        </button>
        <label className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={openNowOnly}
            onChange={(e) => setOpenNowOnly(e.target.checked)}
          />
          Şu an açık olanlar
        </label>
        {geoError && <span className="text-xs text-red-600">{geoError}</span>}
      </div>

      <div className="md:hidden flex items-center justify-center gap-1 p-2 border-b border-gray-200 bg-white">
        <div className="inline-flex rounded-full border border-gray-200 p-0.5 bg-gray-50">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              mobileView === 'list' ? 'bg-white shadow-card text-brand-700' : 'text-gray-500'
            }`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              mobileView === 'map' ? 'bg-white shadow-card text-brand-700' : 'text-gray-500'
            }`}
          >
            Harita
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            mobileView === 'list' ? 'block' : 'hidden'
          } md:block w-full md:w-96 overflow-y-auto p-3 border-r border-gray-200`}
        >
          {loading ? (
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          ) : (
            <PlaceList places={visiblePlaces} activeId={activeId} onHover={setActiveId} />
          )}
        </div>
        <div className={`${mobileView === 'map' ? 'block' : 'hidden'} md:block flex-1`}>
          <MapView places={visiblePlaces} activeId={activeId} onMarkerHover={setActiveId} userLocation={coords} />
        </div>
      </div>
    </div>
  );
}

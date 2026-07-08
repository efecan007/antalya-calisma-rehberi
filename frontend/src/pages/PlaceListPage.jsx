import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import FilterBar from '../components/FilterBar';
import PlaceList from '../components/PlaceList';
import MapView from '../components/MapView';

const DEFAULT_FILTERS = {
  search: '',
  region: '',
  type: '',
  maxPrice: '',
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

  return (
    <div className="h-full flex flex-col">
      <FilterBar filters={filters} onChange={setFilters} />

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
            <PlaceList places={places} activeId={activeId} onHover={setActiveId} />
          )}
        </div>
        <div className={`${mobileView === 'map' ? 'block' : 'hidden'} md:block flex-1`}>
          <MapView places={places} activeId={activeId} onMarkerHover={setActiveId} />
        </div>
      </div>
    </div>
  );
}

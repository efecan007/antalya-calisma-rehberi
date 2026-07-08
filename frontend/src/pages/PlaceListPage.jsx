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
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-96 overflow-y-auto p-3 border-r border-gray-200">
          {loading ? (
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          ) : (
            <PlaceList places={places} activeId={activeId} onHover={setActiveId} />
          )}
        </div>
        <div className="hidden md:block flex-1">
          <MapView places={places} activeId={activeId} onMarkerHover={setActiveId} />
        </div>
      </div>
    </div>
  );
}

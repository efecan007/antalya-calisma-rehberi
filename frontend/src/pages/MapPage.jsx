import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import MapView from '../components/MapView';
import { useLanguage } from '../context/LanguageContext';

export default function MapPage() {
  const { t } = useLanguage();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/places')
      .then(({ data }) => setPlaces(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full relative">
      {loading && (
        <p className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white px-3 py-1.5 rounded-md shadow text-sm text-gray-500">
          {t('common.loading')}
        </p>
      )}
      <MapView places={places} />
    </div>
  );
}

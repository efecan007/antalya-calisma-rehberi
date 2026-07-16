import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { regionLabel, typeLabel, levelLabel, noiseLevelLabel, RATING_CRITERIA } from '../constants';
import RatingStars from '../components/RatingStars';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import FavoriteButton from '../components/FavoriteButton';
import OccupancyCheckIn from '../components/OccupancyCheckIn';
import OccupancyForecast from '../components/OccupancyForecast';
import PlaceChat from '../components/PlaceChat';
import OpenStatusBadge from '../components/OpenStatusBadge';
import useGeolocation from '../hooks/useGeolocation';
import { distanceKm, formatDistance, directionsUrl } from '../lib/geo';

const STATUS_LABELS = {
  PENDING: { text: 'Onay Bekliyor', className: 'bg-amber-100 text-amber-700' },
  REJECTED: { text: 'Reddedildi', className: 'bg-red-100 text-red-700' },
};

const AMENITY_BADGES = [
  { key: 'hasWifi', label: 'Wi-Fi' },
  { key: 'hasAC', label: 'Klima' },
  { key: 'meetingSuitable', label: 'Toplantıya Uygun' },
  { key: 'laptopFriendly', label: 'Uzun Süre Laptop' },
  { key: 'deskFriendly', label: 'Çalışma Masası Uygun' },
];

export default function PlaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const { coords, error: geoError, loading: geoLoading, request: requestLocation } = useGeolocation();

  function fetchPlace() {
    setLoading(true);
    apiClient
      .get(`/places/${id}`)
      .then(({ data }) => setPlace(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchPlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="p-6 text-sm text-gray-500">Yükleniyor...</p>;
  if (!place) return <p className="p-6 text-sm text-gray-500">Mekan bulunamadı.</p>;

  const alreadyReviewed = user && place.reviews.some((r) => r.user?.id === user.id);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <Link to="/mekanlar" className="text-sm text-brand-600 hover:underline">
          ← Keşfete dön
        </Link>

        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-gray-900">{place.name}</h1>
            <FavoriteButton placeId={place.id} className="text-2xl" />
            {STATUS_LABELS[place.status] && (
              <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_LABELS[place.status].className}`}>
                {STATUS_LABELS[place.status].text}
              </span>
            )}
            <OpenStatusBadge openTime={place.openTime} closeTime={place.closeTime} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {typeLabel(place.type)} · {regionLabel(place.region)} · {place.address}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {coords ? (
              <span className="text-sm text-brand-600 font-medium">
                {formatDistance(distanceKm(coords, place))} uzaklıkta
              </span>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                disabled={geoLoading}
                className="text-xs text-brand-600 hover:underline disabled:opacity-50"
              >
                {geoLoading ? 'Konum alınıyor...' : 'Mesafemi göster'}
              </button>
            )}
            <a
              href={directionsUrl(place, 'walking')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:border-brand-300 hover:text-brand-700 transition"
            >
              🚶 Yürüyerek Yol Tarifi
            </a>
            <a
              href={directionsUrl(place, 'driving')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:border-brand-300 hover:text-brand-700 transition"
            >
              🚗 Araçla Yol Tarifi
            </a>
          </div>
          {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
          <div className="mt-2">
            <RatingStars value={place.ratings.overallRating} />
            <span className="text-xs text-gray-400 ml-2">{place.ratings.reviewCount} değerlendirme</span>
          </div>

          <div className="mt-4">
            <OccupancyCheckIn
              placeId={place.id}
              placeName={place.name}
              occupancy={place.occupancy}
              onCheckedIn={(occupancy) => setPlace((p) => ({ ...p, occupancy }))}
            />
            <OccupancyForecast placeId={place.id} />
          </div>

          {place.photoUrls?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-4 -mx-1 px-1">
              {place.photoUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={place.name}
                  className="h-32 w-48 object-cover rounded-xl flex-shrink-0 shadow-card"
                />
              ))}
            </div>
          )}

          {place.description && <p className="mt-4 text-gray-700">{place.description}</p>}

          {place.openingHours && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="text-gray-500">Çalışma Saatleri:</span> {place.openingHours}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              Priz: {levelLabel(place.outletLevel)}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              Sessizlik: {noiseLevelLabel(place.noiseLevel)}
            </span>
            {AMENITY_BADGES.filter((a) => place[a.key]).map((a) => (
              <span key={a.key} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {a.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {RATING_CRITERIA.filter((c) => c.field !== 'overallRating' && c.field !== 'outletCount').map((c) => (
              <div key={c.field} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="font-semibold text-gray-900">{place.ratings[c.field] ?? '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mt-4">
          <h2 className="font-medium text-gray-900 mb-3">Değerlendirmeler</h2>
          <ReviewList reviews={place.reviews} />

          <div className="mt-6">
            {!user && (
              <p className="text-sm text-gray-500">
                Değerlendirme yapmak için{' '}
                <Link to="/giris" className="text-brand-600 hover:underline">
                  giriş yapın
                </Link>
                .
              </p>
            )}
            {user && alreadyReviewed && (
              <p className="text-sm text-gray-500">Bu mekan için zaten bir değerlendirme yaptınız.</p>
            )}
            {user && !alreadyReviewed && <ReviewForm placeId={place.id} onSubmitted={fetchPlace} />}
          </div>
        </div>

        <PlaceChat placeId={place.id} />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { regionLabel, typeLabel, levelLabel, noiseLevelLabel, RATING_CRITERIA } from '../constants';
import RatingStars from '../components/RatingStars';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import FavoriteButton from '../components/FavoriteButton';

const STATUS_LABELS = {
  PENDING: { text: 'Onay Bekliyor', className: 'bg-amber-100 text-amber-700' },
  REJECTED: { text: 'Reddedildi', className: 'bg-red-100 text-red-700' },
};

export default function PlaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← Keşfete dön
      </Link>
      <div className="flex items-center gap-2 mt-2">
        <h1 className="text-2xl font-semibold text-gray-900">{place.name}</h1>
        <FavoriteButton placeId={place.id} className="text-2xl" />
        {STATUS_LABELS[place.status] && (
          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_LABELS[place.status].className}`}>
            {STATUS_LABELS[place.status].text}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {typeLabel(place.type)} · {regionLabel(place.region)} · {place.address}
      </p>
      <div className="mt-2">
        <RatingStars value={place.ratings.overallRating} />
        <span className="text-xs text-gray-400 ml-2">{place.ratings.reviewCount} değerlendirme</span>
      </div>

      {place.photoUrls?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mt-4">
          {place.photoUrls.map((url) => (
            <img key={url} src={url} alt={place.name} className="h-32 w-48 object-cover rounded-lg flex-shrink-0" />
          ))}
        </div>
      )}

      {place.description && <p className="mt-4 text-gray-700">{place.description}</p>}

      {place.openingHours && (
        <p className="mt-2 text-sm text-gray-600">
          <span className="text-gray-500">Çalışma Saatleri:</span> {place.openingHours}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          Priz: {levelLabel(place.outletLevel)}
        </span>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          Sessizlik: {noiseLevelLabel(place.noiseLevel)}
        </span>
        {place.hasWifi && <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Wi-Fi</span>}
        {place.hasAC && <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Klima</span>}
        {place.meetingSuitable && (
          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Toplantıya Uygun</span>
        )}
        {place.laptopFriendly && (
          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Uzun Süre Laptop</span>
        )}
        {place.deskFriendly && (
          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Çalışma Masası Uygun</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6">
        {RATING_CRITERIA.filter((c) => c.field !== 'overallRating').map((c) => (
          <div key={c.field} className="border border-gray-200 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="font-semibold text-gray-900">{place.ratings[c.field] ?? '-'}</p>
          </div>
        ))}
      </div>

      <h2 className="font-medium text-gray-900 mb-3">Değerlendirmeler</h2>
      <ReviewList reviews={place.reviews} />

      <div className="mt-6">
        {!user && (
          <p className="text-sm text-gray-500">
            Değerlendirme yapmak için <Link to="/giris" className="text-brand-600 hover:underline">giriş yapın</Link>.
          </p>
        )}
        {user && alreadyReviewed && (
          <p className="text-sm text-gray-500">Bu mekan için zaten bir değerlendirme yaptınız.</p>
        )}
        {user && !alreadyReviewed && (
          <ReviewForm placeId={place.id} onSubmitted={fetchPlace} />
        )}
      </div>
    </div>
  );
}

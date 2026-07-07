import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { regionLabel, typeLabel, RATING_CRITERIA } from '../constants';
import RatingStars from '../components/RatingStars';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';

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
      <h1 className="text-2xl font-semibold text-gray-900 mt-2">{place.name}</h1>
      <p className="text-sm text-gray-500 mt-1">
        {typeLabel(place.type)} · {regionLabel(place.region)} · {place.address}
      </p>
      <div className="mt-2">
        <RatingStars value={place.ratings.overallRating} />
        <span className="text-xs text-gray-400 ml-2">{place.ratings.reviewCount} değerlendirme</span>
      </div>

      {place.description && <p className="mt-4 text-gray-700">{place.description}</p>}

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

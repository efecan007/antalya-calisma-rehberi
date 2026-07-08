import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { regionLabel, typeLabel } from '../constants';

export default function AdminPage() {
  const [pendingPlaces, setPendingPlaces] = useState([]);
  const [places, setPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [placesRes, pendingRes, reviewsRes] = await Promise.all([
      apiClient.get('/places'),
      apiClient.get('/places/pending'),
      apiClient.get('/reviews'),
    ]);
    setPlaces(placesRes.data);
    setPendingPlaces(pendingRes.data);
    setReviews(reviewsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approve(id) {
    await apiClient.post(`/places/${id}/approve`);
    loadAll();
  }

  async function reject(id) {
    await apiClient.post(`/places/${id}/reject`);
    loadAll();
  }

  async function deletePlace(id) {
    if (!window.confirm('Bu mekanı silmek istediğinize emin misiniz?')) return;
    await apiClient.delete(`/places/${id}`);
    loadAll();
  }

  async function deleteReview(id) {
    await apiClient.delete(`/reviews/${id}`);
    loadAll();
  }

  if (loading) return <p className="p-6 text-sm text-gray-500">Yükleniyor...</p>;

  return (
    <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin Paneli</h1>
        <Link
          to="/mekan-ekle"
          className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-md hover:bg-brand-700"
        >
          + Yeni Mekan Ekle
        </Link>
      </div>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Bekleyen Mekanlar ({pendingPlaces.length})</h2>
        {pendingPlaces.length === 0 && (
          <p className="text-sm text-gray-500">Onay bekleyen mekan önerisi yok.</p>
        )}
        <div className="space-y-2">
          {pendingPlaces.map((place) => (
            <div key={place.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500">
                  {typeLabel(place.type)} · {regionLabel(place.region)} · {place.address}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(place.id)}
                  className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700"
                >
                  Onayla
                </button>
                <button
                  onClick={() => reject(place.id)}
                  className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Tüm Mekanlar ({places.length})</h2>
        <div className="space-y-2">
          {places.map((place) => (
            <div key={place.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500">
                  {typeLabel(place.type)} · {regionLabel(place.region)} · {place.address}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/admin/mekanlar/${place.id}/duzenle`}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200"
                >
                  Düzenle
                </Link>
                <button
                  onClick={() => deletePlace(place.id)}
                  className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Yorumlar ({reviews.length})</h2>
        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{review.user?.name}</span> ·{' '}
                  <span className="text-gray-500">{review.place?.name}</span> ·{' '}
                  <span className="text-amber-600">{review.overallRating}/5</span>
                </p>
                {review.comment && <p className="text-xs text-gray-500 mt-0.5">{review.comment}</p>}
              </div>
              <button
                onClick={() => deleteReview(review.id)}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

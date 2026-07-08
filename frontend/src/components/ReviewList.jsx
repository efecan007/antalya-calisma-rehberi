import { RATING_CRITERIA } from '../constants';

export default function ReviewList({ reviews }) {
  if (!reviews.length) {
    return <p className="text-sm text-gray-500">Henüz değerlendirme yapılmamış. İlk yorumu sen yaz!</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-gray-900">{review.user?.name || 'Kullanıcı'}</span>
            <span className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs text-gray-600 mb-2">
            {RATING_CRITERIA.map((c) => (
              <span key={c.field}>
                {c.label}: <strong>{review[c.field]}</strong>/5
              </span>
            ))}
          </div>
          {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}

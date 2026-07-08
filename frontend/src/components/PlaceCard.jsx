import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import FavoriteButton from './FavoriteButton';
import { regionLabel, typeLabel } from '../constants';

export default function PlaceCard({ place, active, onHover }) {
  return (
    <Link
      to={`/mekan/${place.id}`}
      onMouseEnter={() => onHover?.(place.id)}
      className={`flex gap-3 bg-white border rounded-xl p-3 mb-2 shadow-card transition hover:shadow-card-hover hover:-translate-y-0.5 ${
        active ? 'border-brand-400 ring-1 ring-brand-200' : 'border-gray-100'
      }`}
    >
      {place.photoUrls?.[0] ? (
        <img
          src={place.photoUrls[0]}
          alt={place.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-brand-50 text-brand-300 flex items-center justify-center text-2xl">
          {typeLabel(place.type)?.[0] ?? '📍'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900 truncate">{place.name}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
              {typeLabel(place.type)}
            </span>
            <FavoriteButton placeId={place.id} />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {regionLabel(place.region)} · {place.address}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <RatingStars value={place.ratings?.overallRating} />
          <span className="text-xs text-gray-400">{place.ratings?.reviewCount || 0} değerlendirme</span>
        </div>
      </div>
    </Link>
  );
}

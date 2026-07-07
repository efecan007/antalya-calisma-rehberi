import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { regionLabel, typeLabel } from '../constants';

export default function PlaceCard({ place, active, onHover }) {
  return (
    <Link
      to={`/mekan/${place.id}`}
      onMouseEnter={() => onHover?.(place.id)}
      className={`block border rounded-lg p-3 mb-2 transition ${
        active ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{place.name}</h3>
        <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
          {typeLabel(place.type)}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
        {regionLabel(place.region)} · {place.address}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <RatingStars value={place.ratings?.overallRating} />
        <span className="text-xs text-gray-400">{place.ratings?.reviewCount || 0} değerlendirme</span>
      </div>
    </Link>
  );
}

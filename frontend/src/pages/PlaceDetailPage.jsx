import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { regionLabel, typeLabel, levelLabel, noiseLevelLabel, RATING_CRITERIA } from '../constants';
import RatingStars from '../components/RatingStars';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import CommentList from '../components/CommentList';
import CommentForm from '../components/CommentForm';
import FavoriteButton from '../components/FavoriteButton';
import OccupancyCheckIn from '../components/OccupancyCheckIn';
import OccupancyForecast from '../components/OccupancyForecast';
import PlaceChat from '../components/PlaceChat';
import OpenStatusBadge from '../components/OpenStatusBadge';
import useGeolocation from '../hooks/useGeolocation';
import { distanceKm, formatDistance, directionsUrl } from '../lib/geo';

const STATUS_META = {
  PENDING: { key: 'detail.statusPending', className: 'bg-amber-100 text-amber-700' },
  REJECTED: { key: 'detail.statusRejected', className: 'bg-red-100 text-red-700' },
};

const AMENITY_KEYS = ['hasWifi', 'hasAC', 'meetingSuitable', 'laptopFriendly', 'deskFriendly'];

export default function PlaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [place, setPlace] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { coords, error: geoError, loading: geoLoading, request: requestLocation } = useGeolocation();

  function fetchPlace() {
    setLoading(true);
    apiClient
      .get(`/places/${id}`)
      .then(({ data }) => setPlace(data))
      .finally(() => setLoading(false));
  }

  function fetchComments() {
    apiClient.get(`/places/${id}/comments`).then(({ data }) => setComments(data));
  }

  useEffect(() => {
    fetchPlace();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="p-6 text-sm text-gray-500">{t('common.loading')}</p>;
  if (!place) return <p className="p-6 text-sm text-gray-500">{t('detail.notFound')}</p>;

  const alreadyReviewed = user && place.reviews.some((r) => r.user?.id === user.id);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <Link to="/mekanlar" className="text-sm text-brand-600 hover:underline">
          {t('detail.backToExplore')}
        </Link>

        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-gray-900">{place.name}</h1>
            <FavoriteButton placeId={place.id} className="text-2xl" />
            {STATUS_META[place.status] && (
              <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_META[place.status].className}`}>
                {t(STATUS_META[place.status].key)}
              </span>
            )}
            <OpenStatusBadge openTime={place.openTime} closeTime={place.closeTime} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {typeLabel(place.type, t)} · {regionLabel(place.region)} · {place.address}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {coords ? (
              <span className="text-sm text-brand-600 font-medium">
                {t('place.distanceAway', { distance: formatDistance(distanceKm(coords, place)) })}
              </span>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                disabled={geoLoading}
                className="text-xs text-brand-600 hover:underline disabled:opacity-50"
              >
                {geoLoading ? t('list.gettingLocation') : t('detail.showMyDistance')}
              </button>
            )}
            <a
              href={directionsUrl(place, 'walking')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:border-brand-300 hover:text-brand-700 transition"
            >
              {t('detail.walkingDirections')}
            </a>
            <a
              href={directionsUrl(place, 'driving')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:border-brand-300 hover:text-brand-700 transition"
            >
              {t('detail.drivingDirections')}
            </a>
          </div>
          {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
          <div className="mt-2">
            <RatingStars value={place.ratings.overallRating} />
            <span className="text-xs text-gray-400 ml-2">
              {t('place.reviewCount', { count: place.ratings.reviewCount })}
            </span>
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
              <span className="text-gray-500">{t('detail.workingHours')}</span> {place.openingHours}
            </p>
          )}

          {place.phone && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="text-gray-500">{t('detail.phone')}</span>{' '}
              <a href={`tel:${place.phone}`} className="text-brand-600 hover:underline">
                {place.phone}
              </a>
            </p>
          )}

          {place.website && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="text-gray-500">{t('detail.website')}</span>{' '}
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline break-all"
              >
                {place.website}
              </a>
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              {t('detail.outletPrefix')} {levelLabel(place.outletLevel, t)}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              {t('detail.noisePrefix')} {noiseLevelLabel(place.noiseLevel, t)}
            </span>
            {AMENITY_KEYS.filter((key) => place[key]).map((key) => (
              <span key={key} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {t(`detail.amenity.${key}`)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {RATING_CRITERIA.filter((c) => c.field !== 'overallRating' && c.field !== 'outletCount').map((c) => (
              <div key={c.field} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-gray-500">{t(`enum.rating.${c.field}`)}</p>
                <p className="font-semibold text-gray-900">{place.ratings[c.field] ?? '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mt-4">
          <h2 className="font-medium text-gray-900 mb-3">{t('detail.reviewsHeading')}</h2>
          <ReviewList reviews={place.reviews} />

          <div className="mt-6">
            {!user && (
              <p className="text-sm text-gray-500">
                {t('detail.loginToReviewPre')}{' '}
                <Link to="/giris" className="text-brand-600 hover:underline">
                  {t('detail.loginLink')}
                </Link>
                .
              </p>
            )}
            {user && alreadyReviewed && (
              <p className="text-sm text-gray-500">{t('detail.alreadyReviewed')}</p>
            )}
            {user && !alreadyReviewed && <ReviewForm placeId={place.id} onSubmitted={fetchPlace} />}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 mt-4">
          <h2 className="font-medium text-gray-900 mb-3">{t('detail.commentsHeading')}</h2>
          <CommentList comments={comments} onChanged={fetchComments} />

          <div className="mt-6">
            {!user && (
              <p className="text-sm text-gray-500">
                {t('detail.loginToCommentPre')}{' '}
                <Link to="/giris" className="text-brand-600 hover:underline">
                  {t('detail.loginLink')}
                </Link>
                .
              </p>
            )}
            {user && <CommentForm placeId={place.id} onSubmitted={fetchComments} />}
          </div>
        </div>

        <PlaceChat placeId={place.id} />
      </div>
    </div>
  );
}

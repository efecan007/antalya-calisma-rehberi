import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { REGIONS, PLACE_TYPES, LEVEL_OPTIONS, NOISE_LEVEL_OPTIONS } from '../constants';

const initialState = {
  name: '',
  type: 'CAFE',
  region: 'MURATPASA',
  address: '',
  lat: '',
  lng: '',
  description: '',
  priceLevel: 2,
  photoUrlsText: '',
  outletLevel: 'MEDIUM',
  noiseLevel: 'MEDIUM',
  deskFriendly: true,
  openingHours: '',
  openTime: '',
  closeTime: '',
  hasWifi: true,
  hasAC: true,
  meetingSuitable: false,
  laptopFriendly: true,
};

export default function AddPlacePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const geoDebounceRef = useRef(null);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isEdit) return;
    apiClient.get(`/places/${id}`).then(({ data }) => {
      setForm({
        name: data.name,
        type: data.type,
        region: data.region,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        description: data.description || '',
        priceLevel: data.priceLevel,
        photoUrlsText: (data.photoUrls || []).join('\n'),
        outletLevel: data.outletLevel,
        noiseLevel: data.noiseLevel,
        deskFriendly: data.deskFriendly,
        openingHours: data.openingHours || '',
        openTime: data.openTime || '',
        closeTime: data.closeTime || '',
        hasWifi: data.hasWifi,
        hasAC: data.hasAC,
        meetingSuitable: data.meetingSuitable,
        laptopFriendly: data.laptopFriendly,
      });
      setLoading(false);
    });
  }, [id, isEdit]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleGeoQueryChange(value) {
    setGeoQuery(value);
    setGeoResults([]);
    setGeoError('');
    if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current);
    if (value.trim().length < 3) return;
    geoDebounceRef.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const { data } = await apiClient.get('/places/geocode/search', { params: { q: value } });
        setGeoResults(data);
      } catch {
        setGeoError(t('addPlace.searchFailed'));
      } finally {
        setGeoLoading(false);
      }
    }, 500);
  }

  function applyGeoResult(result) {
    setForm((prev) => ({
      ...prev,
      name: prev.name || result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
    }));
    setGeoResults([]);
    setGeoQuery('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { photoUrlsText, ...rest } = form;
      const photoUrls = photoUrlsText
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean);
      if (isEdit) {
        await apiClient.patch(`/places/${id}`, { ...rest, photoUrls });
        navigate(`/mekan/${id}`);
        return;
      }
      if (isAdmin) {
        const { data } = await apiClient.post('/places', { ...rest, photoUrls });
        navigate(`/mekan/${data.id}`);
      } else {
        await apiClient.post('/suggestions', { ...rest, photoUrls });
        setSuggested(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('addPlace.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">{t('common.loading')}</p>;
  }

  if (suggested) {
    return (
      <div className="h-full overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-card p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('addPlace.suggestedTitle')}</h1>
          <p className="text-sm text-gray-600">
            {t('addPlace.suggestedDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-card p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
        {isEdit ? t('addPlace.titleEdit') : isAdmin ? t('addPlace.titleAdd') : t('addPlace.titleSuggest')}
      </h1>
      {!isEdit && !isAdmin && (
        <p className="text-xs text-gray-500 mb-4">
          {t('addPlace.suggestNote')}
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {!isEdit && (
        <div className="mb-4 relative">
          <label className="block text-sm text-gray-700 mb-1">
            {t('addPlace.geoLabel')}
          </label>
          <input
            type="text"
            placeholder={t('addPlace.geoPlaceholder')}
            value={geoQuery}
            onChange={(e) => handleGeoQueryChange(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
          {geoLoading && <p className="text-xs text-gray-400 mt-1">{t('addPlace.searching')}</p>}
          {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
          {geoResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-card mt-1 max-h-56 overflow-y-auto">
              {geoResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => applyGeoResult(r)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="block font-medium text-gray-900">{r.name}</span>
                    <span className="block text-xs text-gray-500">{r.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {t('addPlace.geoHint')}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t('addPlace.namePlaceholder')}
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            {PLACE_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {t(`enum.placeType.${pt.value}`)}
              </option>
            ))}
          </select>
          <select
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder={t('addPlace.addressPlaceholder')}
          required
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="any"
            placeholder={t('addPlace.latPlaceholder')}
            required
            value={form.lat}
            onChange={(e) => update('lat', e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder={t('addPlace.lngPlaceholder')}
            required
            value={form.lng}
            onChange={(e) => update('lng', e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400">
          {t('addPlace.coordHint')}
        </p>
        <label className="block text-sm text-gray-700">
          {t('addPlace.priceLevel')} {form.priceLevel}
          <input
            type="range"
            min="1"
            max="4"
            value={form.priceLevel}
            onChange={(e) => update('priceLevel', Number(e.target.value))}
            className="w-full"
          />
        </label>
        <textarea
          placeholder={t('addPlace.descPlaceholder')}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            {t('addPlace.outletLevelLabel')}
            <select
              value={form.outletLevel}
              onChange={(e) => update('outletLevel', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {t(`enum.level.${l.value}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            {t('addPlace.noiseLevelLabel')}
            <select
              value={form.noiseLevel}
              onChange={(e) => update('noiseLevel', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            >
              {NOISE_LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {t(`enum.noiseLevel.${l.value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <input
          type="text"
          placeholder={t('addPlace.hoursPlaceholder')}
          value={form.openingHours}
          onChange={(e) => update('openingHours', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            {t('addPlace.openTimeLabel')}
            <input
              type="time"
              value={form.openTime}
              onChange={(e) => update('openTime', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            />
          </label>
          <label className="block text-sm text-gray-700">
            {t('addPlace.closeTimeLabel')}
            <input
              type="time"
              value={form.closeTime}
              onChange={(e) => update('closeTime', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            />
          </label>
        </div>
        <p className="text-xs text-gray-400 -mt-1">
          {t('addPlace.hoursHint')}
        </p>

        <textarea
          placeholder={t('addPlace.photosPlaceholder')}
          value={form.photoUrlsText}
          onChange={(e) => update('photoUrlsText', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.hasWifi}
              onChange={(e) => update('hasWifi', e.target.checked)}
            />
            {t('addPlace.checkWifi')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.hasAC}
              onChange={(e) => update('hasAC', e.target.checked)}
            />
            {t('addPlace.checkAC')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.meetingSuitable}
              onChange={(e) => update('meetingSuitable', e.target.checked)}
            />
            {t('addPlace.checkMeeting')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.laptopFriendly}
              onChange={(e) => update('laptopFriendly', e.target.checked)}
            />
            {t('addPlace.checkLaptop')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.deskFriendly}
              onChange={(e) => update('deskFriendly', e.target.checked)}
            />
            {t('addPlace.checkDesk')}
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {submitting ? t('auth.registering') : isEdit ? t('addPlace.submitEdit') : isAdmin ? t('addPlace.submitAdd') : t('addPlace.submitSuggest')}
        </button>
        </form>
      </div>
    </div>
  );
}

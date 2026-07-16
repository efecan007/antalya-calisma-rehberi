import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [loading, setLoading] = useState(isEdit);
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
      setError(err.response?.data?.message || 'Mekan kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (suggested) {
    return (
      <div className="h-full overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-card p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Öneriniz Alındı</h1>
          <p className="text-sm text-gray-600">
            Mekan öneriniz admin onayına gönderildi. Onaylandığında herkese açık listede görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-card p-5 sm:p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
        {isEdit ? 'Mekanı Düzenle' : isAdmin ? 'Yeni Mekan Ekle' : 'Mekan Öner'}
      </h1>
      {!isEdit && !isAdmin && (
        <p className="text-xs text-gray-500 mb-4">
          Önerdiğiniz mekan, admin onayından sonra herkese açık listede görünür.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Mekan adı"
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
            {PLACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
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
          placeholder="Adres"
          required
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="any"
            placeholder="Enlem (lat)"
            required
            value={form.lat}
            onChange={(e) => update('lat', e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder="Boylam (lng)"
            required
            value={form.lng}
            onChange={(e) => update('lng', e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400">
          İpucu: Google Maps'te mekana sağ tıklayıp koordinatları kopyalayabilirsin.
        </p>
        <label className="block text-sm text-gray-700">
          Fiyat Seviyesi: {form.priceLevel}
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
          placeholder="Açıklama (opsiyonel)"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            Priz Sayısı Seviyesi
            <select
              value={form.outletLevel}
              onChange={(e) => update('outletLevel', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            Sessizlik Seviyesi
            <select
              value={form.noiseLevel}
              onChange={(e) => update('noiseLevel', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            >
              {NOISE_LEVEL_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <input
          type="text"
          placeholder="Çalışma saatleri (ör. 08:00 - 22:00)"
          value={form.openingHours}
          onChange={(e) => update('openingHours', e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-700">
            Açılış Saati
            <input
              type="time"
              value={form.openTime}
              onChange={(e) => update('openTime', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            />
          </label>
          <label className="block text-sm text-gray-700">
            Kapanış Saati
            <input
              type="time"
              value={form.closeTime}
              onChange={(e) => update('closeTime', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-1"
            />
          </label>
        </div>
        <p className="text-xs text-gray-400 -mt-1">
          "Şu an açık/kapalı" ve yakınımdaki mekanlar özelliği için kullanılır.
        </p>

        <textarea
          placeholder="Fotoğraf URL'leri (her satıra bir tane)"
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
            Wi-Fi var
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.hasAC}
              onChange={(e) => update('hasAC', e.target.checked)}
            />
            Klima var
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.meetingSuitable}
              onChange={(e) => update('meetingSuitable', e.target.checked)}
            />
            Toplantı için uygun
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.laptopFriendly}
              onChange={(e) => update('laptopFriendly', e.target.checked)}
            />
            Laptop ile uzun oturmaya uygun
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.deskFriendly}
              onChange={(e) => update('deskFriendly', e.target.checked)}
            />
            Çalışma masası uygun
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {submitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : isAdmin ? 'Mekanı Kaydet' : 'Öneriyi Gönder'}
        </button>
        </form>
      </div>
    </div>
  );
}

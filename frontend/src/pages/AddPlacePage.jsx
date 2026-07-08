import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { REGIONS, PLACE_TYPES } from '../constants';

const initialState = {
  name: '',
  type: 'CAFE',
  region: 'MURATPASA',
  address: '',
  lat: '',
  lng: '',
  description: '',
  priceLevel: 2,
};

export default function AddPlacePage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await apiClient.post('/places', form);
      if (isAdmin) {
        navigate(`/mekan/${data.id}`);
      } else {
        setSuggested(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mekan eklenemedi');
    } finally {
      setSubmitting(false);
    }
  }

  if (suggested) {
    return (
      <div className="h-full overflow-y-auto p-6 max-w-xl mx-auto text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Öneriniz Alındı</h1>
        <p className="text-sm text-gray-600">
          Mekan öneriniz admin onayına gönderildi. Onaylandığında herkese açık listede görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        {isAdmin ? 'Yeni Mekan Ekle' : 'Mekan Öner'}
      </h1>
      {!isAdmin && (
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
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="any"
            placeholder="Enlem (lat)"
            required
            value={form.lat}
            onChange={(e) => update('lat', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder="Boylam (lng)"
            required
            value={form.lng}
            onChange={(e) => update('lng', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Kaydediliyor...' : isAdmin ? 'Mekanı Kaydet' : 'Öneriyi Gönder'}
        </button>
      </form>
    </div>
  );
}

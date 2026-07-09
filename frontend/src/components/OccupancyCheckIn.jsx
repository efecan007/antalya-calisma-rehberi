import { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { OCCUPANCY_LEVELS } from '../constants';
import OccupancyBadge from './OccupancyBadge';

export default function OccupancyCheckIn({ placeId, occupancy, onCheckedIn }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(level) {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/occupancy/${placeId}`, { level });
      onCheckedIn?.(data);
    } catch (err) {
      setError(err.response?.data?.message || 'İşaretleme başarısız oldu');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium text-gray-900">Şu an doluluk durumu</p>
        <OccupancyBadge occupancy={occupancy} />
      </div>
      {!occupancy && <p className="text-xs text-gray-500 mt-1">Henüz bildirim yapılmamış.</p>}

      {user ? (
        <div className="flex gap-2 mt-2.5">
          {OCCUPANCY_LEVELS.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={submitting}
              onClick={() => submit(o.value)}
              className="flex-1 text-xs sm:text-sm border border-gray-200 bg-white rounded-lg py-1.5 hover:border-brand-300 hover:bg-brand-50 transition disabled:opacity-50"
            >
              <span aria-hidden="true">{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-2">Doluluk bildirmek için giriş yapın.</p>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

import { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { OCCUPANCY_LEVELS } from '../constants';
import { saveActiveCheckIn } from '../lib/checkInReminder';
import OccupancyBadge from './OccupancyBadge';

export default function OccupancyCheckIn({ placeId, placeName, occupancy, onCheckedIn }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(level) {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/occupancy/${placeId}`, { level });
      saveActiveCheckIn({ placeId, placeName, level });
      onCheckedIn?.(data);
    } catch (err) {
      setError(err.response?.data?.message || t('occupancy.checkInFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium text-gray-900">{t('occupancy.currentStatus')}</p>
        <OccupancyBadge occupancy={occupancy} />
      </div>
      {!occupancy && <p className="text-xs text-gray-500 mt-1">{t('occupancy.noneReported')}</p>}

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
              <span aria-hidden="true">{o.emoji}</span> {t(`enum.occupancy.${o.value}`)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-2">{t('occupancy.loginToReport')}</p>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

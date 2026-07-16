import { Link } from 'react-router-dom';
import useCheckInReminder from '../hooks/useCheckInReminder';

export default function CheckInReminderBanner() {
  const { phase, record, confirmStillHere, dismiss } = useCheckInReminder();

  if (phase !== 'remind' || !record) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-80 z-30 bg-white border border-gray-200 rounded-xl shadow-card-hover p-4">
      <p className="text-sm font-medium text-gray-900">
        Hâlâ{' '}
        <Link to={`/mekan/${record.placeId}`} className="text-brand-600 hover:underline">
          {record.placeName}
        </Link>
        &apos;de misin?
      </p>
      <p className="text-xs text-gray-500 mt-1">Doluluk durumunun güncel kalması için onayla.</p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={confirmStillHere}
          className="flex-1 bg-brand-600 text-white text-sm rounded-full py-1.5 hover:bg-brand-700 transition"
        >
          Evet, hâlâ buradayım
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex-1 border border-gray-200 text-gray-700 text-sm rounded-full py-1.5 hover:bg-gray-50 transition"
        >
          Hayır, ayrıldım
        </button>
      </div>
    </div>
  );
}

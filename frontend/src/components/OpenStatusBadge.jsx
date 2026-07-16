import { isOpenNow } from '../lib/geo';

export default function OpenStatusBadge({ openTime, closeTime, className = '' }) {
  const open = isOpenNow(openTime, closeTime);
  if (open === null) return null;

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
      } ${className}`}
    >
      {open ? 'Şu an açık' : 'Şu an kapalı'}
    </span>
  );
}

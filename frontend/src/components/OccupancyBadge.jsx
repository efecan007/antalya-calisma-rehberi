import { occupancyMeta, occupancyLabel } from '../constants';
import { useLanguage } from '../context/LanguageContext';

function timeAgoLabel(isoDate, t) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minAgo', { n: minutes });
  const hours = Math.round(minutes / 60);
  return t('time.hoursAgo', { n: hours });
}

export default function OccupancyBadge({ occupancy, className = '' }) {
  const { t } = useLanguage();
  if (!occupancy) return null;

  const meta = occupancyMeta(occupancy.level);
  if (!meta) return null;

  const ago = timeAgoLabel(occupancy.updatedAt, t);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.className} ${className}`}
      title={`${t('badge.reportedBy', { count: occupancy.count })} · ${ago}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {occupancyLabel(occupancy.level, t)} · {ago}
    </span>
  );
}

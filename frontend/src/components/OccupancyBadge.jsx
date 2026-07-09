import { occupancyMeta } from '../constants';

function timeAgoLabel(isoDate) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  return `${hours} sa önce`;
}

export default function OccupancyBadge({ occupancy, className = '' }) {
  if (!occupancy) return null;

  const meta = occupancyMeta(occupancy.level);
  if (!meta) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.className} ${className}`}
      title={`${occupancy.count} kişi bildirdi · ${timeAgoLabel(occupancy.updatedAt)}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label} · {timeAgoLabel(occupancy.updatedAt)}
    </span>
  );
}

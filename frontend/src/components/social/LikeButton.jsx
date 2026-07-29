// Beğeni butonu (sunumsal). Beğeni durumu ve sayısı props ile gelir; tıklama
// olayını yukarı iletir, böylece "anlık" güncellemeyi (optimistic UI) ebeveyn yönetir.
export default function LikeButton({ liked, count, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center gap-1.5 text-sm transition disabled:opacity-50"
      aria-pressed={liked}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-6 w-6 transition ${liked ? 'text-red-500 scale-110' : 'text-gray-700 hover:text-red-500'}`}
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="text-gray-700 tabular-nums">{count}</span>
    </button>
  );
}

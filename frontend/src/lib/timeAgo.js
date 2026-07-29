// "x dakika önce" gibi göreli zaman metni üretir. i18n anahtarları time.* altında.
export function timeAgo(dateStr, t) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  return t('time.daysAgo', { n: days });
}

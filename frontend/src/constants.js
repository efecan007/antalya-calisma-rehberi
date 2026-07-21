export const REGIONS = [
  { value: 'MURATPASA', label: 'Muratpaşa' },
  { value: 'KONYAALTI', label: 'Konyaaltı' },
  { value: 'KEPEZ', label: 'Kepez' },
  { value: 'LARA', label: 'Lara' },
  { value: 'KALEICI', label: 'Kaleiçi' },
  { value: 'DOSEMEALTI', label: 'Döşemealtı' },
  { value: 'AKSU', label: 'Aksu' },
  { value: 'BELEK', label: 'Belek' },
];

export const PLACE_TYPES = [
  { value: 'HOTEL', label: 'Otel Lobisi' },
  { value: 'CAFE', label: 'Kafe' },
  { value: 'LIBRARY', label: 'Kütüphane' },
  { value: 'COWORKING', label: 'Coworking Alanı' },
];

export const LEVEL_OPTIONS = [
  { value: 'LOW', label: 'Az' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Çok' },
];

export const NOISE_LEVEL_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
];

export const RATING_CRITERIA = [
  { field: 'internetSpeed', label: 'İnternet Hızı' },
  { field: 'outletCount', label: 'Priz Sayısı' },
  { field: 'noiseLevel', label: 'Sessizlik' },
  { field: 'coffeeQuality', label: 'Kahve Kalitesi' },
  { field: 'workEnvironment', label: 'Çalışma Ortamı' },
  { field: 'priceLevel', label: 'Fiyat Seviyesi' },
  { field: 'overallRating', label: 'Genel Puan' },
];

export const OCCUPANCY_LEVELS = [
  { value: 'LOW', label: 'Sakin', emoji: '🟢', className: 'bg-emerald-50 text-emerald-700' },
  { value: 'MEDIUM', label: 'Orta Yoğun', emoji: '🟡', className: 'bg-amber-50 text-amber-700' },
  { value: 'HIGH', label: 'Kalabalık', emoji: '🔴', className: 'bg-red-50 text-red-700' },
];

// Bu yardımcılar isteğe bağlı bir çeviri fonksiyonu (t) alır. t verilirse etiket
// aktif dilde döner; verilmezse (geriye dönük uyum için) varsayılan TR etiketi döner.
// Bölgeler özel isim olduğu için her iki dilde de aynıdır, çevrilmez.
export function occupancyMeta(value) {
  return OCCUPANCY_LEVELS.find((o) => o.value === value);
}

export function occupancyLabel(value, t) {
  if (t) return t(`enum.occupancy.${value}`);
  return OCCUPANCY_LEVELS.find((o) => o.value === value)?.label || value;
}

export function regionLabel(value) {
  return REGIONS.find((r) => r.value === value)?.label || value;
}

export function typeLabel(value, t) {
  if (t) return t(`enum.placeType.${value}`);
  return PLACE_TYPES.find((tp) => tp.value === value)?.label || value;
}

export function levelLabel(value, t) {
  if (t) return t(`enum.level.${value}`);
  return LEVEL_OPTIONS.find((l) => l.value === value)?.label || value;
}

export function noiseLevelLabel(value, t) {
  if (t) return t(`enum.noiseLevel.${value}`);
  return NOISE_LEVEL_OPTIONS.find((l) => l.value === value)?.label || value;
}

export function ratingLabel(field, t) {
  if (t) return t(`enum.rating.${field}`);
  return RATING_CRITERIA.find((c) => c.field === field)?.label || field;
}

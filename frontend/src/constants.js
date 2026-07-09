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

export const SORT_OPTIONS = [
  { value: '', label: 'Varsayılan (En Yeni)' },
  { value: 'overallRating-desc', label: 'Puan: Yüksekten Düşüğe' },
  { value: 'overallRating-asc', label: 'Puan: Düşükten Yükseğe' },
  { value: 'internetSpeed-desc', label: 'İnternet Hızı: Yüksekten Düşüğe' },
  { value: 'noiseLevel-desc', label: 'Sessizlik: Yüksekten Düşüğe' },
  { value: 'outletCount-desc', label: 'Priz Sayısı: Yüksekten Düşüğe' },
  { value: 'coffeeQuality-desc', label: 'Kahve Kalitesi: Yüksekten Düşüğe' },
  { value: 'priceLevel-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'priceLevel-asc', label: 'Fiyat: Düşükten Yükseğe' },
];

export function regionLabel(value) {
  return REGIONS.find((r) => r.value === value)?.label || value;
}

export function typeLabel(value) {
  return PLACE_TYPES.find((t) => t.value === value)?.label || value;
}

export function levelLabel(value) {
  return LEVEL_OPTIONS.find((l) => l.value === value)?.label || value;
}

export function noiseLevelLabel(value) {
  return NOISE_LEVEL_OPTIONS.find((l) => l.value === value)?.label || value;
}

export const REGIONS = [
  { value: 'MURATPASA', label: 'Muratpaşa' },
  { value: 'KONYAALTI', label: 'Konyaaltı' },
  { value: 'KEPEZ', label: 'Kepez' },
  { value: 'LARA', label: 'Lara' },
  { value: 'KALEICI', label: 'Kaleiçi' },
  { value: 'DOSEMEALTI', label: 'Döşemealtı' },
  { value: 'AKSU', label: 'Aksu' },
];

export const PLACE_TYPES = [
  { value: 'HOTEL', label: 'Otel' },
  { value: 'CAFE', label: 'Kafe' },
  { value: 'LIBRARY', label: 'Kütüphane' },
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

export function regionLabel(value) {
  return REGIONS.find((r) => r.value === value)?.label || value;
}

export function typeLabel(value) {
  return PLACE_TYPES.find((t) => t.value === value)?.label || value;
}

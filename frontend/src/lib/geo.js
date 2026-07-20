const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function distanceKm(from, to) {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function formatDistance(km) {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isOpenNow(openTime, closeTime, now = new Date()) {
  if (!openTime || !closeTime) return null;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  if (open === close) return true; // 24 saat açık olarak kabul edilir
  if (open < close) return nowMinutes >= open && nowMinutes < close;
  // Gece yarısını geçen çalışma saatleri (ör. 18:00 - 02:00)
  return nowMinutes >= open || nowMinutes < close;
}

export function directionsUrl(place, mode = 'driving') {
  // Hedef olarak sadece koordinat verirsek Google Maps yalnızca bir pin (ve ham
  // koordinat) gösterir, mekan adını değil. Mekan adı + adresi hedef metnine
  // verince Maps gerçek işletmeyi tanıyıp adıyla gösterir; adres eksikse
  // koordinata düşeriz.
  const label = [place.name, place.address].filter(Boolean).join(', ');
  const destination = place.address ? label : `${place.lat},${place.lng}`;
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

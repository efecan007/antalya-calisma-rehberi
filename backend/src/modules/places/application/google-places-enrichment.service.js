const googlePlaces = require('../infrastructure/google-places.client');

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gün — mekan bilgisi sık değişmez,
// Google Places kotasını korumak için aynı mekan tekrar tekrar sorgulanmaz.
const EARTH_RADIUS_M = 6371000;
// Google Places'ın bulduğu sonuç, isim benzerliğiyle yanlışlıkla farklı (ama yakın)
// bir POI'yi eşleştirebilir; belirgin biçimde uzaksa güvenilmez sayılıp reddedilir.
const MAX_MATCH_DISTANCE_METERS = 300;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function extractDetails(details) {
  return {
    name: details.name || null,
    address: details.formatted_address || null,
    lat: details.geometry?.location?.lat ?? null,
    lng: details.geometry?.location?.lng ?? null,
    phone: details.international_phone_number || null,
    website: details.website || null,
    openingHours: details.opening_hours?.weekday_text?.join('; ') || null,
    category: details.type?.[0] || null,
  };
}

class GooglePlacesEnrichmentService {
  constructor({ cache }) {
    this.cache = cache;
  }

  // Verilen mekan için Google Places'ten zenginleştirilmiş detayları döner. Herhangi
  // bir hata/eşleşmeme durumunda `null` döner — çağıran taraf mevcut veriye düşer.
  // Bu metod ASLA fırlatmaz; getPlace() akışını hiçbir koşulda bozmamalıdır.
  async enrich(place) {
    const cacheKey = `google-places:place:${place.id}`;
    const fetchAndMatch = () => this._fetchAndMatch(place);

    try {
      return this.cache
        ? await this.cache.getOrSet(cacheKey, CACHE_TTL_SECONDS, fetchAndMatch)
        : await fetchAndMatch();
    } catch (err) {
      console.warn(`Google Places zenginleştirme başarısız (place ${place.id}):`, err.message);
      return null;
    }
  }

  async _fetchAndMatch(place) {
    const candidate = await googlePlaces.findPlace({
      query: place.name,
      lat: place.lat,
      lng: place.lng,
    });

    const distance = distanceMeters(place, {
      lat: candidate.geometry?.location?.lat ?? place.lat,
      lng: candidate.geometry?.location?.lng ?? place.lng,
    });
    if (distance > MAX_MATCH_DISTANCE_METERS) {
      throw new Error(
        `Google Places eşleşmesi çok uzak (${Math.round(distance)}m), muhtemelen yanlış mekan`
      );
    }

    const details = await googlePlaces.getPlaceDetails(candidate.place_id);
    return extractDetails(details);
  }
}

module.exports = GooglePlacesEnrichmentService;

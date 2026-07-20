// Google Places API (legacy "Find Place" + "Place Details") için ham HTTP istemcisi.
// Tüm Google Places çağrıları burada toplanır; başka hiçbir dosya doğrudan Google'a
// istek atmaz.
const FIND_PLACE_URL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const REQUEST_TIMEOUT_MS = 5000;

class GooglePlacesApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GooglePlacesApiError';
    this.code = code; // 'TIMEOUT' | 'UNAUTHORIZED' | 'NETWORK' | 'BAD_RESPONSE' | 'EMPTY_RESULT'
  }
}

// Google Places her zaman HTTP 200 döner; asıl sonuç gövdedeki `status` alanındadır.
function assertOkStatus(data) {
  if (data.status === 'OK') return;
  if (data.status === 'ZERO_RESULTS') {
    throw new GooglePlacesApiError('Google Places sonuç döndürmedi', 'EMPTY_RESULT');
  }
  if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
    throw new GooglePlacesApiError(
      `Google Places yetkilendirme/istek hatası: ${data.error_message || data.status}`,
      'UNAUTHORIZED'
    );
  }
  if (data.status === 'OVER_QUERY_LIMIT') {
    throw new GooglePlacesApiError('Google Places rate limit aşıldı', 'RATE_LIMIT');
  }
  throw new GooglePlacesApiError(`Google Places API hatası: ${data.status}`, 'BAD_RESPONSE');
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new GooglePlacesApiError(`Google Places API hatası (${response.status})`, 'BAD_RESPONSE');
    }
    const data = await response.json();
    assertOkStatus(data);
    return data;
  } catch (err) {
    if (err instanceof GooglePlacesApiError) throw err;
    if (err.name === 'AbortError') {
      throw new GooglePlacesApiError('Google Places API isteği zaman aşımına uğradı', 'TIMEOUT');
    }
    // fetch, DNS/bağlantı hatalarında (ör. internet yok) düz bir TypeError fırlatır.
    throw new GooglePlacesApiError(`Google Places API isteğine ulaşılamadı: ${err.message}`, 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

function getApiKey() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new GooglePlacesApiError('GOOGLE_PLACES_API_KEY tanımlı değil', 'UNAUTHORIZED');
  }
  return apiKey;
}

// Verilen isim + koordinat civarında en olası mekanı bulur; sonucun Google
// tarafındaki kimliğini (place_id) döner, detaylar Place Details ile ayrıca alınır.
async function findPlace({ query, lat, lng }) {
  const params = new URLSearchParams({
    input: query,
    inputtype: 'textquery',
    fields: 'place_id,name,geometry',
    locationbias: `circle:2000@${lat},${lng}`,
    language: 'tr',
    key: getApiKey(),
  });

  const data = await fetchWithTimeout(`${FIND_PLACE_URL}?${params}`);
  const first = data.candidates?.[0];
  if (!first) {
    throw new GooglePlacesApiError('Google Places sonuç döndürmedi', 'EMPTY_RESULT');
  }
  return first;
}

// Google'ın kendi mekan kimliğiyle (Find Place'ten gelen place_id) tam detay getirir:
// telefon, web sitesi, çalışma saatleri, kategori, adres, koordinat.
async function getPlaceDetails(placeId) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,geometry,international_phone_number,website,opening_hours,types',
    language: 'tr',
    key: getApiKey(),
  });

  const data = await fetchWithTimeout(`${DETAILS_URL}?${params}`);
  return data.result;
}

module.exports = { findPlace, getPlaceDetails, GooglePlacesApiError };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// Antalya il sınırlarına yakın bir kutu; sonuçları bölgeye öncelik vermek için kullanılır.
const ANTALYA_VIEWBOX = '30.30,37.15,31.15,36.65';

async function searchGeocode(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 3) {
      return res.json([]);
    }

    const params = new URLSearchParams({
      format: 'jsonv2',
      q,
      addressdetails: '1',
      limit: '5',
      countrycodes: 'tr',
      viewbox: ANTALYA_VIEWBOX,
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'work-from-hotel-app/1.0 (staj projesi, geocoding)',
        'Accept-Language': 'tr',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim isteği başarısız: ${response.status}`);
    }

    const results = await response.json();
    const mapped = results.map((r) => ({
      name: r.name || r.display_name.split(',')[0],
      address: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchGeocode };

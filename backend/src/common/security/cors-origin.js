// CORS_ORIGIN virgülle ayrılmış birden fazla adres içerebilir (örn. localhost + LAN IP);
// tek adres verilirse string, birden fazlaysa dizi olarak döner (cors paketi ikisini de kabul eder).
function parseCorsOrigin(value) {
  if (!value) return '*';
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 1 ? origins : origins[0];
}

module.exports = { parseCorsOrigin };

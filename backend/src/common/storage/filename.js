const path = require('path');

// MIME tipinden güvenli bir dosya uzantısı türetir (originalname güvenilmez olabilir).
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Yüklenen dosya için çakışmayan benzersiz bir ad üretir: <folder>/<zaman>-<rastgele>.<ext>
function buildObjectPath(file, folder = 'misc') {
  const extFromMime = MIME_EXT[file.mimetype];
  const extFromName = file.originalname ? path.extname(file.originalname).toLowerCase() : '';
  const ext = extFromMime || extFromName || '';
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  return { name, objectPath: `${folder}/${name}` };
}

module.exports = { buildObjectPath };

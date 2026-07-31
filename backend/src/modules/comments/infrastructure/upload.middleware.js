const multer = require('multer');
const { ValidationError } = require('../../../common/errors');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// memoryStorage: dosya buffer olarak alınır, ardından storage soyutlaması (local
// disk veya Firebase Storage) üzerinden kalıcılaştırılır.
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ValidationError('Yalnızca jpeg, png, webp veya gif formatında fotoğraf yükleyebilirsiniz'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { commentPhotoUpload: upload.single('photo') };

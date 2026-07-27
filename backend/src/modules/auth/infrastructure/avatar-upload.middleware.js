const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ValidationError } = require('../../../common/errors');

const uploadDir = path.join(__dirname, '../../../../uploads/avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

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

module.exports = { avatarUpload: upload.single('avatar') };

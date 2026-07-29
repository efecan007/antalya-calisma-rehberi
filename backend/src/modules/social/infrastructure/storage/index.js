const LocalStorageProvider = require('./LocalStorageProvider');

/**
 * Aktif storage sağlayıcısını ortam değişkenine göre seçer. Şimdilik yalnızca
 * "local" destekleniyor; ileride S3/Cloudinary eklenince buraya yeni bir case
 * eklemek yeterli olacak (SOCIAL_STORAGE_DRIVER=s3 gibi).
 */
function createStorageProvider() {
  const driver = process.env.SOCIAL_STORAGE_DRIVER || 'local';

  switch (driver) {
    case 'local':
    default:
      return new LocalStorageProvider({ publicBasePath: '/uploads/social' });
  }
}

module.exports = { storage: createStorageProvider(), createStorageProvider };

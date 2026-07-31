const LocalStorageProvider = require('./LocalStorageProvider');

/**
 * Aktif storage sağlayıcısını STORAGE_DRIVER ortam değişkenine göre seçer.
 *   - local (varsayılan): backend/uploads klasörüne yazar. Geliştirme/Docker için.
 *   - firebase: Firebase Storage'a yükler. Production (Render gibi kalıcı olmayan
 *     disklerde veri kaybını önlemek) için kullanılır.
 *
 * Firebase sağlayıcısı yalnızca gerçekten seçildiğinde require edilir; böylece
 * Firebase'e dokunmayan yerel çalışma/testler bu bağımlılığı yüklemez.
 */
function createStorageProvider() {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();

  switch (driver) {
    case 'firebase': {
      const FirebaseStorageProvider = require('./FirebaseStorageProvider');
      return new FirebaseStorageProvider();
    }
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

module.exports = { storage: createStorageProvider(), createStorageProvider };

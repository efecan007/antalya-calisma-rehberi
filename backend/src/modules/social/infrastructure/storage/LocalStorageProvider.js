const StorageProvider = require('./StorageProvider');

/**
 * Fotoğrafları backend'in local `uploads/` klasöründe saklar. Multer dosyayı zaten
 * disk'e yazdığı (diskStorage) için burada yalnızca herkese açık URL üretilir.
 * Statik sunum app.js'te `app.use('/uploads', express.static(...))` ile yapılır;
 * yerel Docker'da nginx `/uploads/` yolunu backend'e proxy'ler.
 */
class LocalStorageProvider extends StorageProvider {
  constructor({ publicBasePath }) {
    super();
    this.publicBasePath = publicBasePath;
  }

  async save(file) {
    if (!file?.filename) {
      throw new Error('LocalStorageProvider diskStorage ile yazılmış bir dosya bekler');
    }
    return { url: `${this.publicBasePath}/${file.filename}` };
  }
}

module.exports = LocalStorageProvider;

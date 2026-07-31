const fs = require('fs');
const path = require('path');
const StorageProvider = require('./StorageProvider');
const { buildObjectPath } = require('./filename');

/**
 * Dosyaları backend'in local `uploads/<folder>/` klasörüne yazar ve `/uploads/...`
 * göreli URL'ini döner. app.js bu klasörü `express.static('/uploads')` ile sunar
 * (yerel Docker'da nginx `/uploads/` yolunu backend'e proxy'ler).
 *
 * Geliştirme/yerel çalışma için uygundur; kalıcı olmayan disklerde (Render) veri
 * kaybına yol açar — production'da FirebaseStorageProvider kullanılır.
 */
class LocalStorageProvider extends StorageProvider {
  constructor({ baseDir, publicBasePath } = {}) {
    super();
    // backend/uploads (src/common/storage'tan üç seviye yukarı)
    this.baseDir = baseDir || path.join(__dirname, '../../../uploads');
    this.publicBasePath = publicBasePath || '/uploads';
  }

  async save(file, { folder = 'misc' } = {}) {
    if (!file?.buffer) {
      throw new Error('LocalStorageProvider memoryStorage ile alınmış bir dosya (buffer) bekler');
    }
    const { name } = buildObjectPath(file, folder);
    const dir = path.join(this.baseDir, folder);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, name), file.buffer);
    return { url: `${this.publicBasePath}/${folder}/${name}` };
  }
}

module.exports = LocalStorageProvider;

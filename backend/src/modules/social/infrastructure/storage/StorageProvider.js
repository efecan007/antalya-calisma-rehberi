/**
 * Dosya depolama soyutlaması. Social modülü fotoğrafları doğrudan diske/URL'e
 * yazmak yerine bu arayüz üzerinden saklar; böylece ileride AWS S3 veya
 * Cloudinary gibi bir sağlayıcıya geçmek yalnızca yeni bir StorageProvider
 * implementasyonu yazıp container'da onu seçmekle mümkün olur — servis/controller
 * katmanı hiç değişmez.
 */
class StorageProvider {
  /**
   * Yüklenmiş bir dosyayı kalıcılaştırır ve herkese açık erişilebilir URL'ini döner.
   * @param {{ filename?: string, path?: string, buffer?: Buffer, mimetype?: string, originalname?: string }} _file
   * @returns {Promise<{ url: string }>}
   */
  async save(_file) {
    throw new Error('Not implemented');
  }
}

module.exports = StorageProvider;

/**
 * Dosya depolama soyutlaması. Yüklenen dosyalar doğrudan diske/URL'e yazılmak
 * yerine bu arayüz üzerinden saklanır; böylece local disk (geliştirme) ile bulut
 * depolama (Firebase Storage — production) arasında geçmek yalnızca STORAGE_DRIVER
 * ortam değişkenini değiştirmekle mümkün olur. Controller/servis katmanı değişmez.
 *
 * NOT: Render gibi geçici (ephemeral) dosya sistemlerinde local disk her redeploy'da
 * silinir; production'da mutlaka kalıcı bir sağlayıcı (firebase) kullanılmalıdır.
 */
class StorageProvider {
  /**
   * Yüklenmiş bir dosyayı kalıcılaştırır ve herkese açık erişilebilir URL'ini döner.
   * Dosya multer memoryStorage ile alınır; bu yüzden `buffer` her zaman doludur.
   * @param {{ buffer: Buffer, originalname?: string, mimetype?: string }} _file
   * @param {{ folder?: string }} [_options] Depolamada mantıksal klasör (ör. 'avatars').
   * @returns {Promise<{ url: string }>}
   */
  async save(_file, _options) {
    throw new Error('Not implemented');
  }
}

module.exports = StorageProvider;

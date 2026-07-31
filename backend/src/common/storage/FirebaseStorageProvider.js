const { randomUUID } = require('crypto');
const StorageProvider = require('./StorageProvider');
const { buildObjectPath } = require('./filename');
const { getStorageBucket } = require('../security/firebase-admin');

/**
 * Dosyaları Firebase Storage (Google Cloud Storage) kovasına yükler. Render gibi
 * geçici disklerin aksine kalıcıdır: redeploy'da dosyalar kaybolmaz.
 *
 * Herkese açık erişim için kovayı public yapmak (IAM) yerine Firebase'in indirme
 * token'ı yöntemi kullanılır: nesneye rastgele bir `firebaseStorageDownloadTokens`
 * eklenir ve URL bu token'ı taşır. Böylece Storage güvenlik kurallarından bağımsız,
 * yalnızca bu URL'i bilen erişebilir (yüklenen fotoğraflar için istenen davranış).
 */
class FirebaseStorageProvider extends StorageProvider {
  async save(file, { folder = 'misc' } = {}) {
    if (!file?.buffer) {
      throw new Error('FirebaseStorageProvider memoryStorage ile alınmış bir dosya (buffer) bekler');
    }
    const bucket = getStorageBucket();
    const { objectPath } = buildObjectPath(file, folder);
    const token = randomUUID();
    const fileRef = bucket.file(objectPath);

    await fileRef.save(file.buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        contentType: file.mimetype,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const url =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return { url };
  }
}

module.exports = FirebaseStorageProvider;

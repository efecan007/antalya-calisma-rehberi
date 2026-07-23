// Decorator pattern: bir fonksiyonu/metodu, orijinal davranışına dokunmadan
// çalışma süresi + giriş/çıkış/hata loglayan bir sarmalayıcıyla sarar. Bu proje
// CommonJS kullandığı için `@decorator` söz dizimi yerine higher-order fonksiyon
// biçiminde klasik decorator pattern uygulanır: withLogging(fn) -> sarmalanmış fn.
const logger = require('./logger');

function formatDuration(ms) {
  return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// Hem senkron hem async (Promise döndüren) fonksiyonlarla çalışır; `this`
// bağlamını korur ki sınıf metodlarını sararken sorun çıkmasın.
function withLogging(fn, label) {
  const name = label || fn.name || 'anonymous';

  return function wrapped(...args) {
    const start = process.hrtime.bigint();
    logger.debug(`→ ${name} çağrıldı`);

    const onSuccess = (result) => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(`✓ ${name} tamamlandı (${formatDuration(ms)})`);
      return result;
    };
    const onError = (err) => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.error(`✗ ${name} hata verdi (${formatDuration(ms)})`, err);
      throw err;
    };

    try {
      const result = fn.apply(this, args);
      if (result && typeof result.then === 'function') {
        return result.then(onSuccess, onError);
      }
      return onSuccess(result);
    } catch (err) {
      return onError(err);
    }
  };
}

// Bir servis örneğinin (class instance) tüm public prototip metodlarını
// withLogging ile sarar. `_` ile başlayan metodlar iç kullanım sayılır ve
// loglanmaz (ör. _fetchAndMatch). Container dosyalarında tek satırla kullanılır:
//   const placesService = decorateService(new PlacesService({...}), 'PlacesService');
function decorateService(instance, serviceName) {
  const proto = Object.getPrototypeOf(instance);
  const methodNames = Object.getOwnPropertyNames(proto).filter((key) => {
    if (key === 'constructor' || key.startsWith('_')) return false;
    return typeof instance[key] === 'function';
  });

  for (const key of methodNames) {
    const original = instance[key].bind(instance);
    instance[key] = withLogging(original, `${serviceName}.${key}`);
  }

  return instance;
}

module.exports = { withLogging, decorateService };

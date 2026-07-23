const multer = require('multer');
const { DomainError } = require('../errors');
const logger = require('../logging/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Kaynak bulunamadı' });
}

function errorMiddleware(err, req, res, _next) {
  if (err instanceof DomainError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Dosya yüklenemedi: ${err.message}` });
  }

  logger.error('Beklenmeyen sunucu hatası', err);
  res.status(500).json({ message: 'Sunucu hatası' });
}

module.exports = { notFoundHandler, errorMiddleware };

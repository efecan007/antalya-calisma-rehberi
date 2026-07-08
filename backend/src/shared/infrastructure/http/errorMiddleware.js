const { DomainError } = require('../../domain/errors');

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Kaynak bulunamadı' });
}

function errorMiddleware(err, req, res, _next) {
  if (err instanceof DomainError) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: 'Sunucu hatası' });
}

module.exports = { notFoundHandler, errorMiddleware };

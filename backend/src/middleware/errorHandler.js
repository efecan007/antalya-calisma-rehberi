function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Kaynak bulunamadı' });
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Sunucu hatası' });
}

module.exports = { notFoundHandler, errorHandler };

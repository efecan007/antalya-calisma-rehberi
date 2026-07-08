const { verifyToken } = require('../security/jwt');
const { UnauthorizedError } = require('../../domain/errors');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(new UnauthorizedError('Geçersiz veya süresi dolmuş token'));
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice('Bearer '.length));
    } catch (err) {
      // geçersiz token -> anonim kullanıcı olarak devam et
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };

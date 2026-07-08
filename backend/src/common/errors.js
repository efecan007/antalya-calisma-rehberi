class DomainError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class ValidationError extends DomainError {
  constructor(message) {
    super(message, 400);
  }
}

class UnauthorizedError extends DomainError {
  constructor(message = 'Yetkilendirme gerekli') {
    super(message, 401);
  }
}

class ForbiddenError extends DomainError {
  constructor(message = 'Bu işlem için yetkiniz yok') {
    super(message, 403);
  }
}

class NotFoundError extends DomainError {
  constructor(message = 'Kaynak bulunamadı') {
    super(message, 404);
  }
}

class ConflictError extends DomainError {
  constructor(message = 'Kaynak zaten mevcut') {
    super(message, 409);
  }
}

module.exports = {
  DomainError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};

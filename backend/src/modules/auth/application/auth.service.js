const User = require('../../users/domain/User');
const {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../../../common/errors');

class AuthService {
  constructor({ userRepository, hashPassword, comparePassword, signToken }) {
    this.userRepository = userRepository;
    this.hashPassword = hashPassword;
    this.comparePassword = comparePassword;
    this.signToken = signToken;
  }

  async register({ email, password, name }) {
    if (!email || !password || !name) {
      throw new ValidationError('email, password ve name zorunludur');
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Bu e-posta ile kayıtlı bir kullanıcı zaten var');
    }

    const passwordHash = await this.hashPassword(password);
    const created = await this.userRepository.create({ email, passwordHash, name });
    const user = created instanceof User ? created : new User(created);

    const token = this.signToken({ id: user.id, role: user.role });
    return { token, user: user.toPublicJSON() };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new ValidationError('email ve password zorunludur');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Geçersiz e-posta veya şifre');
    }

    const valid = await this.comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Geçersiz e-posta veya şifre');
    }

    const token = this.signToken({ id: user.id, role: user.role });
    return { token, user: user.toPublicJSON() };
  }

  async getCurrentUser({ userId }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }
    return user.toPublicJSON();
  }
}

module.exports = AuthService;

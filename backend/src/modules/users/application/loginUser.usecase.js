const { ValidationError, UnauthorizedError } = require('../../../shared/domain/errors');

class LoginUserUseCase {
  constructor({ userRepository, comparePassword, signToken }) {
    this.userRepository = userRepository;
    this.comparePassword = comparePassword;
    this.signToken = signToken;
  }

  async execute({ email, password }) {
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
}

module.exports = LoginUserUseCase;

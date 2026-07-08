const User = require('../domain/User');
const { ValidationError, ConflictError } = require('../../../shared/domain/errors');

class RegisterUserUseCase {
  /**
   * @param {{ userRepository: import('../domain/UserRepository'), hashPassword: Function, signToken: Function }} deps
   */
  constructor({ userRepository, hashPassword, signToken }) {
    this.userRepository = userRepository;
    this.hashPassword = hashPassword;
    this.signToken = signToken;
  }

  async execute({ email, password, name }) {
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
}

module.exports = RegisterUserUseCase;

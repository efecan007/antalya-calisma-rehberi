const { NotFoundError } = require('../../../shared/domain/errors');

class GetCurrentUserUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ userId }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }
    return user.toPublicJSON();
  }
}

module.exports = GetCurrentUserUseCase;

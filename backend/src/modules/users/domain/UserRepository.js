/**
 * Port (arayüz): infrastructure katmanı bu sözleşmeyi gerçekleştirir.
 * Application katmanı yalnızca bu metot imzalarına bağımlıdır, Prisma'ya değil.
 */
class UserRepository {
  async findByEmail(_email) {
    throw new Error('Not implemented');
  }

  async findById(_id) {
    throw new Error('Not implemented');
  }

  async create(_userData) {
    throw new Error('Not implemented');
  }

  async findByProviderId(_provider, _providerId) {
    throw new Error('Not implemented');
  }

  async update(_id, _userData) {
    throw new Error('Not implemented');
  }

  async findAll() {
    throw new Error('Not implemented');
  }

  async delete(_id) {
    throw new Error('Not implemented');
  }
}

module.exports = UserRepository;

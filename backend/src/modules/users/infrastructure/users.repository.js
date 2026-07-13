const UserRepository = require('../domain/UserRepository');
const User = require('../domain/User');

class UsersRepository extends UserRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findByEmail(email) {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? new User(record) : null;
  }

  async findById(id) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? new User(record) : null;
  }

  async create({ email, passwordHash, name, provider, providerId, avatarUrl }) {
    const record = await this.prisma.user.create({
      data: { email, passwordHash, name, provider, providerId, avatarUrl },
    });
    return new User(record);
  }

  async findByProviderId(provider, providerId) {
    const record = await this.prisma.user.findFirst({ where: { provider, providerId } });
    return record ? new User(record) : null;
  }

  async update(id, data) {
    const record = await this.prisma.user.update({ where: { id }, data });
    return new User(record);
  }

  async findAll() {
    const records = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return records.map((record) => new User(record));
  }

  async delete(id) {
    await this.prisma.user.delete({ where: { id } });
  }
}

module.exports = UsersRepository;

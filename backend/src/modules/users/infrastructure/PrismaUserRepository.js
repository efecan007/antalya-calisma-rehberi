const UserRepository = require('../domain/UserRepository');
const User = require('../domain/User');

class PrismaUserRepository extends UserRepository {
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

  async create({ email, passwordHash, name }) {
    const record = await this.prisma.user.create({ data: { email, passwordHash, name } });
    return new User(record);
  }
}

module.exports = PrismaUserRepository;

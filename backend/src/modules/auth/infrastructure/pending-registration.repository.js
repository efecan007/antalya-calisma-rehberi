// E-posta doğrulaması bekleyen kayıtları yöneten repository. Bir e-posta için tek bir
// bekleyen kayıt tutulur; yeniden kayıt/gönderim durumunda upsert ile token yenilenir.
class PendingRegistrationRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async upsertByEmail(email, { passwordHash, name, companyName, tokenHash, expiresAt }) {
    return this.prisma.pendingRegistration.upsert({
      where: { email },
      create: { email, passwordHash, name, companyName, tokenHash, expiresAt },
      update: { passwordHash, name, companyName, tokenHash, expiresAt },
    });
  }

  async findByTokenHash(tokenHash) {
    return this.prisma.pendingRegistration.findUnique({ where: { tokenHash } });
  }

  async findByEmail(email) {
    return this.prisma.pendingRegistration.findUnique({ where: { email } });
  }

  async deleteByEmail(email) {
    await this.prisma.pendingRegistration.deleteMany({ where: { email } });
  }

  async deleteExpired(now = new Date()) {
    await this.prisma.pendingRegistration.deleteMany({ where: { expiresAt: { lt: now } } });
  }
}

module.exports = PendingRegistrationRepository;

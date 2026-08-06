const request = require('supertest');
const { hashPassword } = require('../../../src/common/security/password');

// E2E testleri için doğrulanmış (e-postası onaylı) bir kullanıcı oluşturur.
// Kayıt akışı artık e-posta doğrulaması gerektirdiğinden, auth dışındaki e2e
// testleri kullanıcıyı doğrudan DB'de oluşturup login ile token alır — böylece
// SMTP/doğrulama akışına bağımlı olmadan test verisini hazırlarlar.
async function createVerifiedUser(app, prisma, { email, password, name, role = 'USER' }) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name, role } });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return { id: user.id, token: login.body.token };
}

module.exports = { createVerifiedUser };

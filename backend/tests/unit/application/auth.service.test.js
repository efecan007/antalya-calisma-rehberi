const AuthService = require('../../../src/modules/auth/application/auth.service');
const User = require('../../../src/modules/users/domain/User');
const {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../../../src/common/errors');

function createInMemoryUserRepository() {
  const users = [];
  let nextId = 1;
  return {
    async findByEmail(email) {
      return users.find((u) => u.email === email) || null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) || null;
    },
    async create(data) {
      const user = new User({ id: nextId++, role: 'USER', createdAt: new Date(), ...data });
      users.push(user);
      return user;
    },
  };
}

function buildService(overrides = {}) {
  return new AuthService({
    userRepository: createInMemoryUserRepository(),
    hashPassword: async (plain) => `hashed:${plain}`,
    comparePassword: async (plain, hash) => hash === `hashed:${plain}`,
    signToken: (payload) => `token-for-${payload.id}`,
    ...overrides,
  });
}

describe('AuthService.register', () => {
  it('geçerli veriyle yeni kullanıcı oluşturur ve token döner', async () => {
    const service = buildService();
    const result = await service.register({ email: 'a@b.com', password: 'secret', name: 'Ali' });

    expect(result.token).toBe('token-for-1');
    expect(result.user.email).toBe('a@b.com');
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('eksik alanlarda ValidationError fırlatır', async () => {
    const service = buildService();
    await expect(service.register({ email: '', password: '', name: '' })).rejects.toThrow(ValidationError);
  });

  it('e-posta zaten kayıtlıysa ConflictError fırlatır', async () => {
    const userRepository = createInMemoryUserRepository();
    const service = buildService({ userRepository });

    await service.register({ email: 'a@b.com', password: 'secret', name: 'Ali' });
    await expect(
      service.register({ email: 'a@b.com', password: 'secret2', name: 'Veli' })
    ).rejects.toThrow(ConflictError);
  });
});

describe('AuthService.login', () => {
  it('doğru şifre ile token döner', async () => {
    const userRepository = createInMemoryUserRepository();
    const service = buildService({ userRepository });
    await service.register({ email: 'a@b.com', password: 'secret', name: 'Ali' });

    const result = await service.login({ email: 'a@b.com', password: 'secret' });
    expect(result.token).toBe('token-for-1');
  });

  it('yanlış şifrede UnauthorizedError fırlatır', async () => {
    const userRepository = createInMemoryUserRepository();
    const service = buildService({ userRepository });
    await service.register({ email: 'a@b.com', password: 'secret', name: 'Ali' });

    await expect(service.login({ email: 'a@b.com', password: 'yanlis' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('kayıtsız e-postada UnauthorizedError fırlatır', async () => {
    const service = buildService();
    await expect(service.login({ email: 'yok@b.com', password: 'secret' })).rejects.toThrow(
      UnauthorizedError
    );
  });
});

describe('AuthService.getCurrentUser', () => {
  it('kullanıcı bulunamazsa NotFoundError fırlatır', async () => {
    const service = buildService();
    await expect(service.getCurrentUser({ userId: 999 })).rejects.toThrow(NotFoundError);
  });

  it('kullanıcı bilgisini parola olmadan döner', async () => {
    const userRepository = createInMemoryUserRepository();
    const service = buildService({ userRepository });
    await service.register({ email: 'a@b.com', password: 'secret', name: 'Ali' });

    const result = await service.getCurrentUser({ userId: 1 });
    expect(result.email).toBe('a@b.com');
    expect(result.passwordHash).toBeUndefined();
  });
});

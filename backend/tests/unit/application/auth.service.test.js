const crypto = require('crypto');
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
    async update(id, data) {
      const user = users.find((u) => u.id === id);
      Object.assign(user, data);
      return user;
    },
  };
}

function createInMemoryPendingRepository() {
  const rows = new Map(); // email -> row
  return {
    async upsertByEmail(email, data) {
      const row = { email, ...data };
      rows.set(email, row);
      return row;
    },
    async findByTokenHash(tokenHash) {
      return [...rows.values()].find((r) => r.tokenHash === tokenHash) || null;
    },
    async findByEmail(email) {
      return rows.get(email) || null;
    },
    async deleteByEmail(email) {
      rows.delete(email);
    },
    async deleteExpired(now = new Date()) {
      for (const [email, row] of rows) {
        if (row.expiresAt.getTime() < now.getTime()) rows.delete(email);
      }
    },
  };
}

function buildService(overrides = {}) {
  const sentEmails = [];
  const service = new AuthService({
    userRepository: createInMemoryUserRepository(),
    pendingRegistrationRepository: createInMemoryPendingRepository(),
    hashPassword: async (plain) => `hashed:${plain}`,
    comparePassword: async (plain, hash) => hash === `hashed:${plain}`,
    signToken: (payload) => `token-for-${payload.id}`,
    generateVerificationToken: () => crypto.randomBytes(8).toString('hex'),
    hashVerificationToken: (raw) => `hash:${raw}`,
    sendVerificationEmail: async (payload) => {
      sentEmails.push(payload);
    },
    ...overrides,
  });
  service._sentEmails = sentEmails;
  return service;
}

// Kayıt + doğrulama tam akışını çalıştırıp gerçek kullanıcıyı oluşturur.
async function registerAndVerify(service, { email, password, name, companyName }) {
  await service.register({ email, password, name, companyName });
  const sent = service._sentEmails[service._sentEmails.length - 1];
  return service.verifyEmail({ token: sent.token });
}

describe('AuthService.register', () => {
  it('yeni e-postada hesabı hemen oluşturmaz, doğrulama e-postası gönderir', async () => {
    const service = buildService();
    const result = await service.register({ email: 'a@b.com', password: 'secret123', name: 'Ali' });

    expect(result.pendingVerification).toBe(true);
    expect(result.email).toBe('a@b.com');
    expect(result.token).toBeUndefined();
    expect(service._sentEmails).toHaveLength(1);
    expect(service._sentEmails[0].email).toBe('a@b.com');
    expect(service._sentEmails[0].token).toBeTruthy();
  });

  it('eksik alanlarda ValidationError fırlatır', async () => {
    const service = buildService();
    await expect(service.register({ email: '', password: '', name: '' })).rejects.toThrow(ValidationError);
  });

  it('geçersiz e-posta formatında ValidationError fırlatır', async () => {
    const service = buildService();
    await expect(
      service.register({ email: 'not-an-email', password: 'secret123', name: 'Ali' })
    ).rejects.toThrow(ValidationError);
  });

  it('8 karakterden kısa şifrede ValidationError fırlatır', async () => {
    const service = buildService();
    await expect(
      service.register({ email: 'a@b.com', password: 'short', name: 'Ali' })
    ).rejects.toThrow(ValidationError);
  });

  it('doğrulama e-postasına normalize edilmiş e-posta gönderir', async () => {
    const service = buildService();
    const result = await service.register({
      email: '  Ali@Example.COM  ',
      password: 'secret123',
      name: 'Ali',
    });
    expect(result.email).toBe('ali@example.com');
    expect(service._sentEmails[0].email).toBe('ali@example.com');
  });

  it('e-posta doğrulanmış (şifreli) bir hesapla kayıtlıysa ConflictError fırlatır', async () => {
    const service = buildService();
    await registerAndVerify(service, { email: 'a@b.com', password: 'secret123', name: 'Ali' });
    await expect(
      service.register({ email: 'a@b.com', password: 'secret1234', name: 'Veli' })
    ).rejects.toThrow(ConflictError);
  });
});

describe('AuthService.verifyEmail', () => {
  it('geçerli token ile gerçek hesabı oluşturur ve token döner', async () => {
    const service = buildService();
    await service.register({ email: 'a@b.com', password: 'secret123', name: 'Ali' });
    const token = service._sentEmails[0].token;

    const result = await service.verifyEmail({ token });
    expect(result.token).toBe('token-for-1');
    expect(result.user.email).toBe('a@b.com');
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('doğrulamadan sonra kullanıcı giriş yapabilir', async () => {
    const service = buildService();
    await registerAndVerify(service, { email: 'a@b.com', password: 'secret123', name: 'Ali' });
    const result = await service.login({ email: 'a@b.com', password: 'secret123' });
    expect(result.token).toBe('token-for-1');
  });

  it('token yoksa ValidationError fırlatır', async () => {
    const service = buildService();
    await expect(service.verifyEmail({ token: '' })).rejects.toThrow(ValidationError);
  });

  it('geçersiz token ile ValidationError fırlatır', async () => {
    const service = buildService();
    await service.register({ email: 'a@b.com', password: 'secret123', name: 'Ali' });
    await expect(service.verifyEmail({ token: 'gecersiz' })).rejects.toThrow(ValidationError);
  });

  it('süresi dolmuş token ile ValidationError fırlatır', async () => {
    const service = buildService();
    let captured;
    service.generateVerificationToken = () => {
      captured = 'fixed-token';
      return captured;
    };
    // Süresi geçmişte bir kayıt oluştur.
    await service.pendingRegistrationRepository.upsertByEmail('a@b.com', {
      passwordHash: 'hashed:secret123',
      name: 'Ali',
      companyName: null,
      tokenHash: service.hashVerificationToken('fixed-token'),
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.verifyEmail({ token: 'fixed-token' })).rejects.toThrow(ValidationError);
  });

  it('token tek kullanımlıktır: ikinci kez kullanılamaz', async () => {
    const service = buildService();
    await service.register({ email: 'a@b.com', password: 'secret123', name: 'Ali' });
    const token = service._sentEmails[0].token;
    await service.verifyEmail({ token });
    await expect(service.verifyEmail({ token })).rejects.toThrow(ValidationError);
  });
});

describe('AuthService.resendVerification', () => {
  it('bekleyen kayıt varsa yeni doğrulama e-postası gönderir', async () => {
    const service = buildService();
    await service.register({ email: 'a@b.com', password: 'secret123', name: 'Ali' });
    await service.resendVerification({ email: 'a@b.com' });
    expect(service._sentEmails).toHaveLength(2);
  });

  it('bekleyen kayıt yoksa sessizce ok döner (durum sızdırmaz)', async () => {
    const service = buildService();
    const result = await service.resendVerification({ email: 'yok@b.com' });
    expect(result).toEqual({ ok: true });
    expect(service._sentEmails).toHaveLength(0);
  });
});

describe('AuthService.login', () => {
  it('doğru şifre ile token döner', async () => {
    const service = buildService();
    await registerAndVerify(service, { email: 'a@b.com', password: 'secret123', name: 'Ali' });

    const result = await service.login({ email: 'a@b.com', password: 'secret123' });
    expect(result.token).toBe('token-for-1');
  });

  it('yanlış şifrede UnauthorizedError fırlatır', async () => {
    const service = buildService();
    await registerAndVerify(service, { email: 'a@b.com', password: 'secret123', name: 'Ali' });

    await expect(service.login({ email: 'a@b.com', password: 'yanlis' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('kayıtsız e-postada UnauthorizedError fırlatır', async () => {
    const service = buildService();
    await expect(service.login({ email: 'yok@b.com', password: 'secret123' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('doğrulanmamış (yalnızca bekleyen) e-posta ile giriş yapılamaz', async () => {
    const service = buildService();
    await service.register({ email: 'a@b.com', password: 'secret123', name: 'Ali' });
    await expect(service.login({ email: 'a@b.com', password: 'secret123' })).rejects.toThrow(
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
    const service = buildService();
    await registerAndVerify(service, { email: 'a@b.com', password: 'secret123', name: 'Ali' });

    const result = await service.getCurrentUser({ userId: 1 });
    expect(result.email).toBe('a@b.com');
    expect(result.passwordHash).toBeUndefined();
  });
});

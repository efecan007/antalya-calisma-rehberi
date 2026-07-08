const RegisterUserUseCase = require('../../../src/modules/users/application/registerUser.usecase');
const { ValidationError, ConflictError } = require('../../../src/shared/domain/errors');

function createInMemoryUserRepository() {
  const users = [];
  let nextId = 1;
  return {
    async findByEmail(email) {
      return users.find((u) => u.email === email) || null;
    },
    async create(data) {
      const user = { id: nextId++, role: 'USER', createdAt: new Date(), ...data };
      users.push(user);
      return user;
    },
  };
}

describe('RegisterUserUseCase', () => {
  function buildUseCase(overrides = {}) {
    return new RegisterUserUseCase({
      userRepository: createInMemoryUserRepository(),
      hashPassword: async (plain) => `hashed:${plain}`,
      signToken: (payload) => `token-for-${payload.id}`,
      ...overrides,
    });
  }

  it('geçerli veriyle yeni kullanıcı oluşturur ve token döner', async () => {
    const useCase = buildUseCase();
    const result = await useCase.execute({ email: 'a@b.com', password: 'secret', name: 'Ali' });

    expect(result.token).toBe('token-for-1');
    expect(result.user.email).toBe('a@b.com');
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('eksik alanlarda ValidationError fırlatır', async () => {
    const useCase = buildUseCase();
    await expect(useCase.execute({ email: '', password: '', name: '' })).rejects.toThrow(ValidationError);
  });

  it('e-posta zaten kayıtlıysa ConflictError fırlatır', async () => {
    const userRepository = createInMemoryUserRepository();
    const useCase = new RegisterUserUseCase({
      userRepository,
      hashPassword: async (plain) => `hashed:${plain}`,
      signToken: () => 'token',
    });

    await useCase.execute({ email: 'a@b.com', password: 'secret', name: 'Ali' });
    await expect(
      useCase.execute({ email: 'a@b.com', password: 'secret2', name: 'Veli' })
    ).rejects.toThrow(ConflictError);
  });
});

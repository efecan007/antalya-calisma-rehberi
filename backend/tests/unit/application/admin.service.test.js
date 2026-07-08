const AdminService = require('../../../src/modules/admin/application/admin.service');
const User = require('../../../src/modules/users/domain/User');
const { ForbiddenError } = require('../../../src/common/errors');

function buildDeps({ users = [] } = {}) {
  const deleted = [];
  return {
    reviewRepository: { async findMany() { return []; } },
    userRepository: {
      async findAll() {
        return users;
      },
      async delete(id) {
        deleted.push(id);
      },
    },
    adminRepository: {
      async getDashboardCounts() {
        return { totalUsers: 5, totalPlaces: 10, pendingSuggestions: 2, totalReviews: 20, totalFavorites: 7 };
      },
    },
    deleted,
  };
}

describe('AdminService.getDashboardStats', () => {
  it('adminRepository sayımlarını döner', async () => {
    const service = new AdminService(buildDeps());
    const stats = await service.getDashboardStats();
    expect(stats).toEqual({
      totalUsers: 5,
      totalPlaces: 10,
      pendingSuggestions: 2,
      totalReviews: 20,
      totalFavorites: 7,
    });
  });
});

describe('AdminService.listUsers', () => {
  it('kullanıcıları parola olmadan serialize eder', async () => {
    const users = [new User({ id: 1, email: 'a@b.com', name: 'Ali', role: 'USER', passwordHash: 'x', createdAt: new Date() })];
    const service = new AdminService(buildDeps({ users }));
    const result = await service.listUsers();
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('a@b.com');
    expect(result[0].passwordHash).toBeUndefined();
  });
});

describe('AdminService.deleteUser', () => {
  it('kendi hesabını silmeye çalışırsa ForbiddenError fırlatır', async () => {
    const service = new AdminService(buildDeps());
    await expect(service.deleteUser({ id: 1, requesterId: 1 })).rejects.toThrow(ForbiddenError);
  });

  it('başka bir kullanıcıyı siler', async () => {
    const deps = buildDeps();
    const service = new AdminService(deps);
    await service.deleteUser({ id: 2, requesterId: 1 });
    expect(deps.deleted).toEqual([2]);
  });
});

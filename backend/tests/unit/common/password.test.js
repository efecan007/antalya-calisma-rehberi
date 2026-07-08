const { hashPassword, comparePassword } = require('../../../src/common/security/password');

describe('hashPassword / comparePassword', () => {
  it('hashlenen şifre düz metinle aynı değildir', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('doğru şifre ile karşılaştırma true döner', async () => {
    const hash = await hashPassword('secret123');
    await expect(comparePassword('secret123', hash)).resolves.toBe(true);
  });

  it('yanlış şifre ile karşılaştırma false döner', async () => {
    const hash = await hashPassword('secret123');
    await expect(comparePassword('yanlis-sifre', hash)).resolves.toBe(false);
  });

  it('aynı şifre iki kez hashlendiğinde farklı hash üretir (salt)', async () => {
    const hash1 = await hashPassword('secret123');
    const hash2 = await hashPassword('secret123');
    expect(hash1).not.toBe(hash2);
  });
});

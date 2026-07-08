process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';

const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../../../src/common/security/jwt');

describe('signToken / verifyToken', () => {
  it('imzalanan token doğrulandığında aynı payload\'ı döner', () => {
    const token = signToken({ id: 1, role: 'ADMIN' });
    const decoded = verifyToken(token);
    expect(decoded).toEqual(expect.objectContaining({ id: 1, role: 'ADMIN' }));
  });

  it('değiştirilmiş (tampered) token doğrulanamaz', () => {
    const token = signToken({ id: 1, role: 'USER' });
    const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('yanlış secret ile imzalanmış token doğrulanamaz', () => {
    const foreignToken = jwt.sign({ id: 1, role: 'ADMIN' }, 'baska-bir-secret');
    expect(() => verifyToken(foreignToken)).toThrow();
  });

  it('süresi dolmuş token doğrulanamaz', () => {
    const expiredToken = jwt.sign({ id: 1, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(() => verifyToken(expiredToken)).toThrow();
  });
});

process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';

const { requireAuth, requireAdmin, optionalAuth } = require('../../../src/common/guards/auth.guard');
const { signToken } = require('../../../src/common/security/jwt');
const { UnauthorizedError, ForbiddenError } = require('../../../src/common/errors');

function buildReq(headers = {}) {
  return { headers };
}

describe('requireAuth', () => {
  it('Authorization header yoksa UnauthorizedError ile next çağrılır', () => {
    const next = jest.fn();
    requireAuth(buildReq(), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('Bearer önekiyle başlamayan header UnauthorizedError fırlatır', () => {
    const next = jest.fn();
    requireAuth(buildReq({ authorization: 'Token abc123' }), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('geçersiz token UnauthorizedError ile next çağrılır', () => {
    const next = jest.fn();
    requireAuth(buildReq({ authorization: 'Bearer not-a-real-token' }), {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('geçerli token ile req.user set edilir ve next argümansız çağrılır', () => {
    const token = signToken({ id: 7, role: 'USER' });
    const req = buildReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(expect.objectContaining({ id: 7, role: 'USER' }));
  });
});

describe('requireAdmin', () => {
  it('req.user yoksa ForbiddenError fırlatır', () => {
    const next = jest.fn();
    requireAdmin({}, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('role USER ise ForbiddenError fırlatır', () => {
    const next = jest.fn();
    requireAdmin({ user: { role: 'USER' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('role ADMIN ise next argümansız çağrılır', () => {
    const next = jest.fn();
    requireAdmin({ user: { role: 'ADMIN' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('optionalAuth', () => {
  it('header yoksa req.user set edilmeden next çağrılır', () => {
    const req = buildReq();
    const next = jest.fn();
    optionalAuth(req, {}, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('geçersiz token sessizce yutulur, anonim olarak devam eder', () => {
    const req = buildReq({ authorization: 'Bearer garbage' });
    const next = jest.fn();
    optionalAuth(req, {}, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('geçerli token ile req.user set edilir', () => {
    const token = signToken({ id: 3, role: 'ADMIN' });
    const req = buildReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    optionalAuth(req, {}, next);

    expect(req.user).toEqual(expect.objectContaining({ id: 3, role: 'ADMIN' }));
    expect(next).toHaveBeenCalledWith();
  });
});

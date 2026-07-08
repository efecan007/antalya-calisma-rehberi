const { hashPassword, comparePassword } = require('../../../common/security/password');
const { signToken } = require('../../../common/security/jwt');
const { userRepository } = require('../../users/infrastructure/users.container');
const AuthService = require('../application/auth.service');

const authService = new AuthService({ userRepository, hashPassword, comparePassword, signToken });

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser({ userId: req.user.id });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// JWT stateless olduğu için sunucu tarafında iptal edilecek bir oturum yok;
// bu endpoint yalnızca istemcinin token'ı bıraktığını doğrulamak için var.
function logout(_req, res) {
  res.status(204).send();
}

module.exports = { register, login, me, logout };

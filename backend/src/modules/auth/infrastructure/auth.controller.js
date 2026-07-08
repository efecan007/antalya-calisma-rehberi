const prisma = require('../../../database/prisma.client');
const { hashPassword, comparePassword } = require('../../../common/security/password');
const { signToken } = require('../../../common/security/jwt');
const UsersRepository = require('../../users/infrastructure/users.repository');
const AuthService = require('../application/auth.service');

const userRepository = new UsersRepository(prisma);
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

module.exports = { register, login, me };

const prisma = require('../../../shared/infrastructure/prisma/client');
const { hashPassword, comparePassword } = require('../../../shared/infrastructure/security/password');
const { signToken } = require('../../../shared/infrastructure/security/jwt');
const PrismaUserRepository = require('./PrismaUserRepository');
const RegisterUserUseCase = require('../application/registerUser.usecase');
const LoginUserUseCase = require('../application/loginUser.usecase');
const GetCurrentUserUseCase = require('../application/getCurrentUser.usecase');

const userRepository = new PrismaUserRepository(prisma);
const registerUserUseCase = new RegisterUserUseCase({ userRepository, hashPassword, signToken });
const loginUserUseCase = new LoginUserUseCase({ userRepository, comparePassword, signToken });
const getCurrentUserUseCase = new GetCurrentUserUseCase({ userRepository });

async function register(req, res, next) {
  try {
    const result = await registerUserUseCase.execute(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUserUseCase.execute(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await getCurrentUserUseCase.execute({ userId: req.user.id });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };

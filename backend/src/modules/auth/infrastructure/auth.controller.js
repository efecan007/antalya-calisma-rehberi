const { hashPassword, comparePassword } = require('../../../common/security/password');
const { signToken } = require('../../../common/security/jwt');
const { userRepository } = require('../../users/infrastructure/users.container');
const AuthService = require('../application/auth.service');
const linkedin = require('./linkedin.client');
const google = require('./google.client');

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

function linkedinRedirect(_req, res) {
  res.redirect(linkedin.buildAuthorizationUrl());
}

async function linkedinCallback(req, res) {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  try {
    const { code, state, error } = req.query;
    if (error || !code || !state) {
      throw new Error(error || 'Eksik code/state');
    }
    linkedin.verifyState(state);

    const accessToken = await linkedin.exchangeCodeForToken(code);
    const profile = await linkedin.fetchProfile(accessToken);
    if (!profile.email) {
      throw new Error('LinkedIn hesabından e-posta alınamadı');
    }

    const { token } = await authService.loginWithOAuth({ provider: 'linkedin', ...profile });
    res.redirect(`${frontendUrl}/giris/linkedin?token=${encodeURIComponent(token)}`);
  } catch (err) {
    res.redirect(`${frontendUrl}/giris?error=linkedin_auth_failed`);
  }
}

function googleRedirect(_req, res) {
  res.redirect(google.buildAuthorizationUrl());
}

async function googleCallback(req, res) {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  try {
    const { code, state, error } = req.query;
    if (error || !code || !state) {
      throw new Error(error || 'Eksik code/state');
    }
    google.verifyState(state);

    const accessToken = await google.exchangeCodeForToken(code);
    const profile = await google.fetchProfile(accessToken);
    if (!profile.email) {
      throw new Error('Google hesabından e-posta alınamadı');
    }

    const { token } = await authService.loginWithOAuth({ provider: 'google', ...profile });
    res.redirect(`${frontendUrl}/giris/google?token=${encodeURIComponent(token)}`);
  } catch (err) {
    res.redirect(`${frontendUrl}/giris?error=google_auth_failed`);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  linkedinRedirect,
  linkedinCallback,
  googleRedirect,
  googleCallback,
};

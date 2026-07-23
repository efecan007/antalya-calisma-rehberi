const { hashPassword, comparePassword } = require('../../../common/security/password');
const { signToken } = require('../../../common/security/jwt');
const { verifyIdToken, createCustomToken } = require('../../../common/security/firebase-admin');
const { userRepository } = require('../../users/infrastructure/users.container');
const AuthService = require('../application/auth.service');
const linkedin = require('./linkedin.client');
const { decorateService } = require('../../../common/logging/withLogging');

const authService = decorateService(
  new AuthService({ userRepository, hashPassword, comparePassword, signToken }),
  'AuthService'
);

function getFrontendUrl() {
  const origins = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return origins.split(',')[0].trim();
}

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

// Google ve LinkedIn girişleri artık Firebase üzerinden ilerliyor. İstemci Firebase'e
// giriş yaptıktan sonra elde ettiği kimlik jetonunu buraya gönderir; jetonu Firebase
// Admin SDK ile doğrulayıp uygulamanın kendi JWT'sini üretiriz. Böylece rol sistemi,
// kullanıcı tablosu ve mevcut guard'lar aynen çalışmaya devam eder.
async function firebaseLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken zorunludur' });
    }

    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err) {
      // Firebase doğrulama hataları (auth/*) istemci kaynaklıdır -> 401. Diğer
      // hatalar (ör. eksik Admin yapılandırması) sunucu hatasıdır -> dış catch.
      if (typeof err?.code === 'string' && err.code.startsWith('auth/')) {
        return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş kimlik jetonu' });
      }
      throw err;
    }

    // LinkedIn custom token köprüsü 'provider' claim'i taşır; Google girişleri ise
    // Firebase'in standart sign_in_provider alanıyla gelir.
    let provider;
    if (decoded.provider) {
      provider = decoded.provider;
    } else if (decoded.firebase?.sign_in_provider === 'google.com') {
      provider = 'google';
    } else {
      return res.status(401).json({ message: 'Desteklenmeyen giriş sağlayıcısı' });
    }

    const email = decoded.email;
    if (!email) {
      return res.status(401).json({ message: 'Sağlayıcıdan e-posta alınamadı' });
    }

    const result = await authService.loginWithOAuth({
      provider,
      providerId: decoded.uid,
      email,
      name: decoded.name,
      avatarUrl: decoded.picture,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function linkedinRedirect(_req, res) {
  res.redirect(linkedin.buildAuthorizationUrl());
}

// LinkedIn Firebase'in yerleşik sağlayıcısı olmadığı için OAuth akışını backend
// yürütür; ardından istemcinin Firebase'e giriş yapabilmesi için bir custom token
// üretip callback sayfasına yönlendiririz.
async function linkedinCallback(req, res) {
  const frontendUrl = getFrontendUrl();
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

    const customToken = await createCustomToken(`linkedin:${profile.providerId}`, {
      provider: 'linkedin',
      email: profile.email,
      name: profile.name,
      picture: profile.avatarUrl,
    });
    res.redirect(`${frontendUrl}/giris/linkedin?customToken=${encodeURIComponent(customToken)}`);
  } catch (err) {
    res.redirect(`${frontendUrl}/giris?error=linkedin_auth_failed`);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  firebaseLogin,
  linkedinRedirect,
  linkedinCallback,
};

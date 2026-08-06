const User = require('../../users/domain/User');
const {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../../../common/errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
// Doğrulama linkinin geçerlilik süresi (ms). 24 saat.
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

class AuthService {
  constructor({
    userRepository,
    pendingRegistrationRepository,
    hashPassword,
    comparePassword,
    signToken,
    generateVerificationToken,
    hashVerificationToken,
    sendVerificationEmail,
  }) {
    this.userRepository = userRepository;
    this.pendingRegistrationRepository = pendingRegistrationRepository;
    this.hashPassword = hashPassword;
    this.comparePassword = comparePassword;
    this.signToken = signToken;
    this.generateVerificationToken = generateVerificationToken;
    this.hashVerificationToken = hashVerificationToken;
    this.sendVerificationEmail = sendVerificationEmail;
  }

  // Kayıt: hesabı HEMEN oluşturmaz. Bilgileri bekleyen kayıt tablosuna yazar ve
  // e-postaya doğrulama linki gönderir. Gerçek User, verifyEmail sırasında oluşturulur.
  async register({ email, password, name, companyName }) {
    if (!email || !password || !name) {
      throw new ValidationError('email, password ve name zorunludur');
    }
    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new ValidationError('Geçerli bir e-posta adresi girin');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır`);
    }
    const trimmedCompanyName = companyName?.trim() || null;

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      // OAuth (LinkedIn/Google) ile açılmış ama şifresiz bir hesap varsa, e-posta
      // sağlayıcı üzerinden zaten doğrulanmıştır; ikinci bir doğrulamaya gerek yok,
      // aynı hesaba şifreyi doğrudan ekleyip oturum açtırırız.
      if (existing.passwordHash) {
        throw new ConflictError('Bu e-posta ile kayıtlı bir kullanıcı zaten var');
      }
      const passwordHash = await this.hashPassword(password);
      const updated = await this.userRepository.update(existing.id, {
        passwordHash,
        ...(trimmedCompanyName ? { companyName: trimmedCompanyName } : {}),
      });
      const user = updated instanceof User ? updated : new User(updated);
      const token = this.signToken({ id: user.id, role: user.role });
      return { token, user: user.toPublicJSON() };
    }

    // Süresi geçmiş bekleyen kayıtları fırsatçı olarak temizle (ayrı bir zamanlanmış
    // iş kurmadan tabloyu makul boyutta tutar).
    await this.pendingRegistrationRepository.deleteExpired();

    const passwordHash = await this.hashPassword(password);
    const rawToken = this.generateVerificationToken();
    const tokenHash = this.hashVerificationToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    await this.pendingRegistrationRepository.upsertByEmail(normalizedEmail, {
      passwordHash,
      name: name.trim(),
      companyName: trimmedCompanyName,
      tokenHash,
      expiresAt,
    });

    // E-postayı beklemeden gönder: SMTP yavaş/erişilemez olsa bile kayıt yanıtı
    // anında döner (aksi halde gönderim askıda kalırsa istek de kilitlenir).
    // sendVerificationEmail içinde hata yakalandığı için promise reddetmez.
    this.sendVerificationEmail({ email: normalizedEmail, name: name.trim(), token: rawToken });

    return { pendingVerification: true, email: normalizedEmail };
  }

  // Doğrulama linkindeki token ile gerçek hesabı oluşturur ve oturum açtırır.
  async verifyEmail({ token }) {
    if (!token) {
      throw new ValidationError('Doğrulama token’ı zorunludur');
    }
    const tokenHash = this.hashVerificationToken(token);
    const pending = await this.pendingRegistrationRepository.findByTokenHash(tokenHash);
    if (!pending) {
      throw new ValidationError('Geçersiz veya kullanılmış doğrulama bağlantısı');
    }
    if (pending.expiresAt.getTime() < Date.now()) {
      await this.pendingRegistrationRepository.deleteByEmail(pending.email);
      throw new ValidationError('Doğrulama bağlantısının süresi dolmuş. Lütfen tekrar kayıt olun.');
    }

    // Bekleyen kayıt oluşturulduktan sonra aynı e-posta başka bir yolla (OAuth) hesap
    // açmış olabilir; bu durumda çakışmayı önlemek için bekleyeni temizleyip hata veririz.
    const existing = await this.userRepository.findByEmail(pending.email);
    if (existing) {
      await this.pendingRegistrationRepository.deleteByEmail(pending.email);
      throw new ConflictError('Bu e-posta ile kayıtlı bir kullanıcı zaten var');
    }

    const created = await this.userRepository.create({
      email: pending.email,
      passwordHash: pending.passwordHash,
      name: pending.name,
      companyName: pending.companyName,
    });
    const user = created instanceof User ? created : new User(created);
    await this.pendingRegistrationRepository.deleteByEmail(pending.email);

    const authToken = this.signToken({ id: user.id, role: user.role });
    return { token: authToken, user: user.toPublicJSON() };
  }

  // Doğrulama e-postasını yeniden gönderir. Kayıtlı olmayan/doğrulanmış e-postaların
  // durumunu sızdırmamak için her durumda aynı sonucu döner.
  async resendVerification({ email }) {
    if (!email) {
      throw new ValidationError('email zorunludur');
    }
    const normalizedEmail = normalizeEmail(email);
    const pending = await this.pendingRegistrationRepository.findByEmail(normalizedEmail);
    if (pending && pending.name) {
      const rawToken = this.generateVerificationToken();
      const tokenHash = this.hashVerificationToken(rawToken);
      const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
      await this.pendingRegistrationRepository.upsertByEmail(normalizedEmail, {
        passwordHash: pending.passwordHash,
        name: pending.name,
        companyName: pending.companyName,
        tokenHash,
        expiresAt,
      });
      // Beklemeden gönder (register ile aynı gerekçe).
      this.sendVerificationEmail({ email: normalizedEmail, name: pending.name, token: rawToken });
    }
    return { ok: true };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new ValidationError('email ve password zorunludur');
    }

    const user = await this.userRepository.findByEmail(normalizeEmail(email));
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Geçersiz e-posta veya şifre');
    }

    const valid = await this.comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Geçersiz e-posta veya şifre');
    }

    const token = this.signToken({ id: user.id, role: user.role });
    return { token, user: user.toPublicJSON() };
  }

  async loginWithOAuth({ provider, providerId, email, name, avatarUrl }) {
    if (!provider || !providerId || !email) {
      throw new ValidationError('provider, providerId ve email zorunludur');
    }
    const normalizedEmail = normalizeEmail(email);

    let user = await this.userRepository.findByProviderId(provider, providerId);

    if (!user) {
      const existingByEmail = await this.userRepository.findByEmail(normalizedEmail);
      if (existingByEmail) {
        user = await this.userRepository.update(existingByEmail.id, {
          provider,
          providerId,
          avatarUrl: avatarUrl || existingByEmail.avatarUrl,
        });
      } else {
        const created = await this.userRepository.create({
          email: normalizedEmail,
          name: (name || normalizedEmail).trim(),
          provider,
          providerId,
          avatarUrl,
        });
        user = created instanceof User ? created : new User(created);
      }
    }

    const token = this.signToken({ id: user.id, role: user.role });
    return { token, user: user.toPublicJSON() };
  }

  async getCurrentUser({ userId }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }
    return user.toPublicJSON();
  }

  async updateAvatar({ userId, avatarUrl }) {
    if (!avatarUrl) {
      throw new ValidationError('avatarUrl zorunludur');
    }
    const updated = await this.userRepository.update(userId, { avatarUrl });
    const user = updated instanceof User ? updated : new User(updated);
    return user.toPublicJSON();
  }

  async removeAvatar({ userId }) {
    const updated = await this.userRepository.update(userId, { avatarUrl: null });
    const user = updated instanceof User ? updated : new User(updated);
    return user.toPublicJSON();
  }
}

module.exports = AuthService;

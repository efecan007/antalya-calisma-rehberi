class User {
  constructor({ id, email, name, role, passwordHash, provider, providerId, avatarUrl, createdAt }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.passwordHash = passwordHash;
    this.provider = provider;
    this.providerId = providerId;
    this.avatarUrl = avatarUrl;
    this.createdAt = createdAt;
  }

  toPublicJSON() {
    const { passwordHash, ...rest } = this;
    return rest;
  }
}

module.exports = User;

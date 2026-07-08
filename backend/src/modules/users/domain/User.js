class User {
  constructor({ id, email, name, role, passwordHash, createdAt }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
  }

  toPublicJSON() {
    const { passwordHash, ...rest } = this;
    return rest;
  }
}

module.exports = User;

const { ValidationError } = require('../../../common/errors');

const VALUES = ['LOW', 'MEDIUM', 'HIGH'];

class LevelRating {
  static isValid(value) {
    return VALUES.includes(value);
  }

  static assertValid(value, field) {
    if (!LevelRating.isValid(value)) {
      throw new ValidationError(`${field} şunlardan biri olmalı: ${VALUES.join(', ')}`);
    }
  }
}

LevelRating.VALUES = VALUES;

module.exports = LevelRating;

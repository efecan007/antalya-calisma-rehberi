const { ValidationError } = require('../../../common/errors');

const VALUES = ['HOTEL', 'CAFE', 'LIBRARY', 'COWORKING'];

class PlaceType {
  static isValid(value) {
    return VALUES.includes(value);
  }

  static assertValid(value) {
    if (!PlaceType.isValid(value)) {
      throw new ValidationError(`type şunlardan biri olmalı: ${VALUES.join(', ')}`);
    }
  }
}

PlaceType.VALUES = VALUES;

module.exports = PlaceType;

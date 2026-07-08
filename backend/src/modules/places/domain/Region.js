const { ValidationError } = require('../../../common/errors');

const VALUES = ['MURATPASA', 'KONYAALTI', 'KEPEZ', 'LARA', 'KALEICI', 'DOSEMEALTI', 'AKSU', 'BELEK'];

class Region {
  static isValid(value) {
    return VALUES.includes(value);
  }

  static assertValid(value) {
    if (!Region.isValid(value)) {
      throw new ValidationError(`region şunlardan biri olmalı: ${VALUES.join(', ')}`);
    }
  }
}

Region.VALUES = VALUES;

module.exports = Region;

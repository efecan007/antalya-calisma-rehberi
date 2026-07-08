const { ValidationError } = require('../../../shared/domain/errors');

const MIN = 1;
const MAX = 5;

/**
 * Value Object: 1-5 aralığında bir tam sayı puanı temsil eder.
 * Geçersiz bir değerle her zaman ValidationError fırlatır, böylece
 * "kötü veri" hiçbir zaman domain sınırının içine giremez.
 */
class Rating {
  constructor(value, fieldName = 'rating') {
    const num = Number(value);
    if (!Number.isInteger(num) || num < MIN || num > MAX) {
      throw new ValidationError(`${fieldName} ${MIN} ile ${MAX} arasında bir tam sayı olmalıdır`);
    }
    this.value = num;
  }

  static isValid(value) {
    const num = Number(value);
    return Number.isInteger(num) && num >= MIN && num <= MAX;
  }
}

module.exports = Rating;

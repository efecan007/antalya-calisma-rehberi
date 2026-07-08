const Rating = require('../../../src/modules/reviews/domain/Rating');
const { ValidationError } = require('../../../src/shared/domain/errors');

describe('Rating value object', () => {
  it.each([1, 2, 3, 4, 5])('%i gibi geçerli bir puanı kabul eder', (value) => {
    expect(new Rating(value).value).toBe(value);
  });

  it.each([0, 6, -1, 3.5, 'abc', null, undefined])('%p gibi geçersiz bir puanı reddeder', (value) => {
    expect(() => new Rating(value)).toThrow(ValidationError);
  });

  it('isValid ile deneme yapılabilir', () => {
    expect(Rating.isValid(3)).toBe(true);
    expect(Rating.isValid(9)).toBe(false);
  });
});

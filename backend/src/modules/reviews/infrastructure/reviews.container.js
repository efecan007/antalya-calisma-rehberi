/**
 * Composition root (dependency wiring) for the reviews module.
 * Diğer modüller (places, admin) reviews'in repository/service'ine
 * ihtiyaç duyduğunda bu container üzerinden erişir; Prisma/cache detaylarını bilmesi gerekmez.
 */
const prisma = require('../../../database/prisma.client');
const cache = require('../../cache/cache.service');
const { placeRepository } = require('../../places/infrastructure/places.container');
const ReviewsRepository = require('./reviews.repository');
const ReviewsService = require('../application/reviews.service');

const reviewRepository = new ReviewsRepository(prisma);
const reviewsService = new ReviewsService({ reviewRepository, placeRepository, cache });

module.exports = { reviewRepository, reviewsService };

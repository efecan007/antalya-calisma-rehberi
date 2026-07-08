/**
 * Composition root (dependency wiring) for the reviews module.
 * Diğer modüller (places) reviews'in use-case'lerine ihtiyaç duyduğunda
 * bu container üzerinden erişir; Prisma/cache detaylarını bilmesi gerekmez.
 */
const prisma = require('../../../shared/infrastructure/prisma/client');
const cache = require('../../../shared/infrastructure/cache/cache');
const PrismaReviewRepository = require('./PrismaReviewRepository');
const PrismaPlaceRepository = require('../../places/infrastructure/PrismaPlaceRepository');
const CreateReviewUseCase = require('../application/createReview.usecase');
const UpdateReviewUseCase = require('../application/updateReview.usecase');
const DeleteReviewUseCase = require('../application/deleteReview.usecase');

const reviewRepository = new PrismaReviewRepository(prisma);
const placeRepository = new PrismaPlaceRepository(prisma);

const createReviewUseCase = new CreateReviewUseCase({ reviewRepository, placeRepository, cache });
const updateReviewUseCase = new UpdateReviewUseCase({ reviewRepository, cache });
const deleteReviewUseCase = new DeleteReviewUseCase({ reviewRepository, cache });

module.exports = { reviewRepository, createReviewUseCase, updateReviewUseCase, deleteReviewUseCase };

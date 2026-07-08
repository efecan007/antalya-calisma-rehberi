class ListAllReviewsUseCase {
  constructor({ reviewRepository }) {
    this.reviewRepository = reviewRepository;
  }

  async execute() {
    return this.reviewRepository.findMany();
  }
}

module.exports = ListAllReviewsUseCase;

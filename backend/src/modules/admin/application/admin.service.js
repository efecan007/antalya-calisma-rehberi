class AdminService {
  constructor({ reviewRepository }) {
    this.reviewRepository = reviewRepository;
  }

  async listAllReviews() {
    return this.reviewRepository.findMany();
  }
}

module.exports = AdminService;

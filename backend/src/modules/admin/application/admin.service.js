const { ForbiddenError } = require('../../../common/errors');

class AdminService {
  constructor({ reviewRepository, userRepository, adminRepository }) {
    this.reviewRepository = reviewRepository;
    this.userRepository = userRepository;
    this.adminRepository = adminRepository;
  }

  async listAllReviews() {
    return this.reviewRepository.findMany();
  }

  async getDashboardStats() {
    return this.adminRepository.getDashboardCounts();
  }

  async listUsers() {
    const users = await this.userRepository.findAll();
    return users.map((user) => user.toPublicJSON());
  }

  async deleteUser({ id, requesterId }) {
    if (id === requesterId) {
      throw new ForbiddenError('Kendi hesabınızı silemezsiniz');
    }
    await this.userRepository.delete(id);
  }
}

module.exports = AdminService;

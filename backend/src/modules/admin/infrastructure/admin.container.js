const { reviewRepository } = require('../../reviews/infrastructure/reviews.container');
const AdminService = require('../application/admin.service');

const adminService = new AdminService({ reviewRepository });

module.exports = { adminService };

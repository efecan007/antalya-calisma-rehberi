const prisma = require('../../../database/prisma.client');
const { reviewRepository } = require('../../reviews/infrastructure/reviews.container');
const { userRepository } = require('../../users/infrastructure/users.container');
const AdminRepository = require('./admin.repository');
const AdminService = require('../application/admin.service');

const adminRepository = new AdminRepository(prisma);
const adminService = new AdminService({ reviewRepository, userRepository, adminRepository });

module.exports = { adminService };

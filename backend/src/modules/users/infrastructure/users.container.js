const prisma = require('../../../database/prisma.client');
const UsersRepository = require('./users.repository');

const userRepository = new UsersRepository(prisma);

module.exports = { userRepository };

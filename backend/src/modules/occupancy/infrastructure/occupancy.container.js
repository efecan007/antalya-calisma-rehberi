const prisma = require('../../../database/prisma.client');
const { placeRepository } = require('../../places/infrastructure/places.container');
const OccupancyRepository = require('./occupancy.repository');
const OccupancyService = require('../application/occupancy.service');

const occupancyRepository = new OccupancyRepository(prisma);
const occupancyService = new OccupancyService({ occupancyRepository, placeRepository });

module.exports = { occupancyRepository, occupancyService };

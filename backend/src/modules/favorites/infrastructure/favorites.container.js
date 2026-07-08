const prisma = require('../../../database/prisma.client');
const cache = require('../../cache/cache.service');
const { placeRepository } = require('../../places/infrastructure/places.container');
const FavoritesRepository = require('./favorites.repository');
const FavoritesService = require('../application/favorites.service');

const favoriteRepository = new FavoritesRepository(prisma);
const favoritesService = new FavoritesService({ favoriteRepository, placeRepository, cache });

module.exports = { favoriteRepository, favoritesService };

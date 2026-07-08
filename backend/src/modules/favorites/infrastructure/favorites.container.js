const prisma = require('../../../database/prisma.client');
const { placeRepository } = require('../../places/infrastructure/places.container');
const FavoritesRepository = require('./favorites.repository');
const FavoritesService = require('../application/favorites.service');

const favoriteRepository = new FavoritesRepository(prisma);
const favoritesService = new FavoritesService({ favoriteRepository, placeRepository });

module.exports = { favoriteRepository, favoritesService };

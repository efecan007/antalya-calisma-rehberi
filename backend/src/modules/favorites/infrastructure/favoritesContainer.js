const prisma = require('../../../shared/infrastructure/prisma/client');
const PrismaFavoriteRepository = require('./PrismaFavoriteRepository');
const PrismaPlaceRepository = require('../../places/infrastructure/PrismaPlaceRepository');
const AddFavoriteUseCase = require('../application/addFavorite.usecase');
const RemoveFavoriteUseCase = require('../application/removeFavorite.usecase');
const ListFavoritesUseCase = require('../application/listFavorites.usecase');

const favoriteRepository = new PrismaFavoriteRepository(prisma);
const placeRepository = new PrismaPlaceRepository(prisma);

const addFavoriteUseCase = new AddFavoriteUseCase({ favoriteRepository, placeRepository });
const removeFavoriteUseCase = new RemoveFavoriteUseCase({ favoriteRepository });
const listFavoritesUseCase = new ListFavoritesUseCase({ favoriteRepository });

module.exports = { addFavoriteUseCase, removeFavoriteUseCase, listFavoritesUseCase };

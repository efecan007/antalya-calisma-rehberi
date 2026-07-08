/**
 * Composition root (dependency wiring) for the places module.
 * Diğer modüller (suggestions, favorites, reviews) places'in repository/service'ine
 * ihtiyaç duyduğunda bu container üzerinden erişir; Prisma/cache detaylarını bilmesi gerekmez.
 */
const prisma = require('../../../database/prisma.client');
const cache = require('../../cache/cache.service');
const PlacesRepository = require('./places.repository');
const PlacesService = require('../application/places.service');

const placeRepository = new PlacesRepository(prisma);
const placesService = new PlacesService({ placeRepository, cache });

module.exports = { placeRepository, placesService };

/**
 * Composition root (dependency wiring) for the places module.
 * Diğer modüller (suggestions, favorites, reviews) places'in repository/service'ine
 * ihtiyaç duyduğunda bu container üzerinden erişir; Prisma/cache detaylarını bilmesi gerekmez.
 */
const prisma = require('../../../database/prisma.client');
const cache = require('../../cache/cache.service');
const PlacesRepository = require('./places.repository');
const PlacesService = require('../application/places.service');
// occupancy.container'ı değil, doğrudan repository/service sınıflarını kullanır —
// occupancy.container zaten bu dosyadaki placeRepository'e ihtiyaç duyuyor,
// bu yüzden ters yönde import döngüsel bağımlılık yaratır.
const OccupancyRepository = require('../../occupancy/infrastructure/occupancy.repository');
const OccupancyService = require('../../occupancy/application/occupancy.service');

const placeRepository = new PlacesRepository(prisma);
const occupancyRepository = new OccupancyRepository(prisma);
const occupancyService = new OccupancyService({ occupancyRepository, placeRepository });
const placesService = new PlacesService({ placeRepository, cache, occupancyService });

module.exports = { placeRepository, placesService };

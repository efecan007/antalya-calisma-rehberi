const cache = require('../../cache/cache.service');
const { placeRepository, placesService } = require('../../places/infrastructure/places.container');
const SuggestionsService = require('../application/suggestions.service');

const suggestionsService = new SuggestionsService({ placeRepository, cache, placesService });

module.exports = { suggestionsService };

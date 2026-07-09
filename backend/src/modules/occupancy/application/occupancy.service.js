const { NotFoundError, ValidationError } = require('../../../common/errors');
const LevelRating = require('../../places/domain/LevelRating');
const { summarize } = require('../domain/OccupancyAggregator');

// Doluluk hızlı değiştiği için sadece son 2 saatteki check-in'ler sayılır.
const WINDOW_MINUTES = 120;
// Aynı kullanıcının aynı mekanı arka arkaya işaretleyerek özeti manipüle
// etmesini önlemek için bekleme süresi.
const COOLDOWN_MINUTES = 15;

class OccupancyService {
  constructor({ occupancyRepository, placeRepository }) {
    this.occupancyRepository = occupancyRepository;
    this.placeRepository = placeRepository;
  }

  async checkIn({ userId, placeId, level }) {
    LevelRating.assertValid(level, 'level');

    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    const last = await this.occupancyRepository.findLatestByUserAndPlace(userId, placeId);
    if (last) {
      const minutesSince = (Date.now() - new Date(last.createdAt).getTime()) / 60000;
      if (minutesSince < COOLDOWN_MINUTES) {
        const wait = Math.ceil(COOLDOWN_MINUTES - minutesSince);
        throw new ValidationError(`Bu mekanı tekrar işaretlemeden önce ${wait} dakika bekleyin`);
      }
    }

    await this.occupancyRepository.create({ userId, placeId, level });
    return this.getSummary({ placeId });
  }

  async getSummary({ placeId }) {
    const summaries = await this.getSummaries({ placeIds: [placeId] });
    return summaries[placeId];
  }

  async getSummaries({ placeIds }) {
    if (!placeIds.length) return {};

    const since = new Date(Date.now() - WINDOW_MINUTES * 60000);
    const checkins = await this.occupancyRepository.findRecentByPlaceIds(placeIds, since);

    const byPlace = new Map();
    for (const checkin of checkins) {
      if (!byPlace.has(checkin.placeId)) byPlace.set(checkin.placeId, []);
      byPlace.get(checkin.placeId).push(checkin);
    }

    const result = {};
    for (const placeId of placeIds) {
      result[placeId] = summarize(byPlace.get(placeId) || []);
    }
    return result;
  }
}

OccupancyService.WINDOW_MINUTES = WINDOW_MINUTES;
OccupancyService.COOLDOWN_MINUTES = COOLDOWN_MINUTES;

module.exports = OccupancyService;

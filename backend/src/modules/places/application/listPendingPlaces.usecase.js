class ListPendingPlacesUseCase {
  constructor({ placeRepository }) {
    this.placeRepository = placeRepository;
  }

  async execute() {
    const places = await this.placeRepository.findMany({ status: 'PENDING' });
    return places.map((place) => place.toJSON());
  }
}

module.exports = ListPendingPlacesUseCase;

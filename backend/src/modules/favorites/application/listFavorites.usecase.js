class ListFavoritesUseCase {
  constructor({ favoriteRepository }) {
    this.favoriteRepository = favoriteRepository;
  }

  async execute({ userId }) {
    const places = await this.favoriteRepository.listPlacesByUser(userId);
    return places.map((place) => place.toJSON());
  }
}

module.exports = ListFavoritesUseCase;

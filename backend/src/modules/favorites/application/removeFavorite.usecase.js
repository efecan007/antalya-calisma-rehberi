class RemoveFavoriteUseCase {
  constructor({ favoriteRepository }) {
    this.favoriteRepository = favoriteRepository;
  }

  async execute({ userId, placeId }) {
    await this.favoriteRepository.remove(userId, placeId);
  }
}

module.exports = RemoveFavoriteUseCase;

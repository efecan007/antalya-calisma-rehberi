class ReviewRepository {
  async findMany() {
    throw new Error('Not implemented');
  }

  async findByPlaceAndUser(_placeId, _userId) {
    throw new Error('Not implemented');
  }

  async findByPlace(_placeId) {
    throw new Error('Not implemented');
  }

  async findById(_id) {
    throw new Error('Not implemented');
  }

  async create(_reviewData) {
    throw new Error('Not implemented');
  }

  async update(_id, _reviewData) {
    throw new Error('Not implemented');
  }

  async delete(_id) {
    throw new Error('Not implemented');
  }
}

module.exports = ReviewRepository;

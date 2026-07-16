class MessageRepository {
  async create(_data) {
    throw new Error('Not implemented');
  }

  async findByPlace(_placeId, _options) {
    throw new Error('Not implemented');
  }

  async findById(_id) {
    throw new Error('Not implemented');
  }

  async findLastByPlaceExcludingUser(_placeId, _excludeUserId, _beforeId) {
    throw new Error('Not implemented');
  }

  async findAll() {
    throw new Error('Not implemented');
  }

  async delete(_id) {
    throw new Error('Not implemented');
  }
}

module.exports = MessageRepository;

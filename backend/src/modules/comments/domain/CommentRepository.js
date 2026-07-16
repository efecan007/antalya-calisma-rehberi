class CommentRepository {
  async findByPlace(_placeId, _viewerId) {
    throw new Error('Not implemented');
  }

  async findById(_id, _viewerId) {
    throw new Error('Not implemented');
  }

  async create(_data) {
    throw new Error('Not implemented');
  }

  async update(_id, _data) {
    throw new Error('Not implemented');
  }

  async delete(_id) {
    throw new Error('Not implemented');
  }

  async setPinned(_id, _pinned) {
    throw new Error('Not implemented');
  }

  async findHelpfulVote(_commentId, _userId) {
    throw new Error('Not implemented');
  }

  async addHelpfulVote(_commentId, _userId) {
    throw new Error('Not implemented');
  }

  async removeHelpfulVote(_commentId, _userId) {
    throw new Error('Not implemented');
  }

  async findReport(_commentId, _userId) {
    throw new Error('Not implemented');
  }

  async createReport(_data) {
    throw new Error('Not implemented');
  }

  async findReportedComments() {
    throw new Error('Not implemented');
  }

  async dismissReports(_commentId) {
    throw new Error('Not implemented');
  }
}

module.exports = CommentRepository;

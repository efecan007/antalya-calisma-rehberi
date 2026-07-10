const { NotFoundError, ValidationError } = require('../../../common/errors');

const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_PAGE_SIZE = 50;

class ChatService {
  constructor({ messageRepository, placeRepository }) {
    this.messageRepository = messageRepository;
    this.placeRepository = placeRepository;
  }

  async sendMessage({ placeId, userId, content }) {
    const trimmed = (content ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('Mesaj boş olamaz');
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(`Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir`);
    }

    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    return this.messageRepository.create({ placeId, userId, content: trimmed });
  }

  async listMessages({ placeId, afterId }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    return this.messageRepository.findByPlace(placeId, { afterId, limit: DEFAULT_PAGE_SIZE });
  }
}

module.exports = ChatService;

const { NotFoundError, ValidationError, ForbiddenError } = require('../../../common/errors');

const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_PAGE_SIZE = 50;

class ChatService {
  constructor({ messageRepository, placeRepository, notificationsService }) {
    this.messageRepository = messageRepository;
    this.placeRepository = placeRepository;
    this.notificationsService = notificationsService;
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

    const message = await this.messageRepository.create({ placeId, userId, content: trimmed });

    // Sohbet thread'siz olduğu için "cevap" kavramını, kendisinden önceki
    // farklı kullanıcıya ait en güncel mesaj üzerinden yaklaşık olarak tespit ediyoruz.
    const repliedTo = await this.messageRepository.findLastByPlaceExcludingUser(placeId, userId, message.id);
    if (repliedTo && this.notificationsService) {
      await this.notificationsService.notify({
        userId: repliedTo.userId,
        type: 'CHAT_REPLY',
        message: `"${place.name}" sohbetinde sana bir cevap geldi.`,
        placeId,
      });
    }

    return message;
  }

  async listMessages({ placeId, afterId }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    return this.messageRepository.findByPlace(placeId, { afterId, limit: DEFAULT_PAGE_SIZE });
  }

  async listAll() {
    return this.messageRepository.findAll();
  }

  async deleteMessage({ messageId, userId, requesterRole }) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Mesaj bulunamadı');
    }
    if (message.userId !== userId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu mesajı silme yetkiniz yok');
    }

    await this.messageRepository.delete(messageId);
  }
}

module.exports = ChatService;

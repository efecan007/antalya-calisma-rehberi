const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../../common/errors');
const { invalidatePlaceDetailCache } = require('../../cache/place-cache-keys');

const MAX_CONTENT_LENGTH = 1000;
const MAX_REPORT_REASON_LENGTH = 300;

function assertValidContent(content) {
  if (!content || !content.trim()) {
    throw new ValidationError('Yorum metni boş olamaz');
  }
  if (content.trim().length > MAX_CONTENT_LENGTH) {
    throw new ValidationError(`Yorum en fazla ${MAX_CONTENT_LENGTH} karakter olabilir`);
  }
}

class CommentsService {
  constructor({ commentRepository, placeRepository, cache }) {
    this.commentRepository = commentRepository;
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async listByPlace({ placeId, viewerId }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    return this.commentRepository.findByPlace(placeId, viewerId);
  }

  async createComment({ placeId, userId, content, photoUrl }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    assertValidContent(content);

    const comment = await this.commentRepository.create({
      placeId,
      userId,
      content: content.trim(),
      photoUrl: photoUrl ?? null,
    });

    await invalidatePlaceDetailCache(this.cache, placeId);
    return comment;
  }

  async updateComment({ commentId, userId, content, photoUrl, removePhoto }) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenError('Bu yorumu düzenleme yetkiniz yok');
    }

    if (content !== undefined) assertValidContent(content);

    const data = {};
    if (content !== undefined) data.content = content.trim();
    if (photoUrl !== undefined) data.photoUrl = photoUrl;
    if (removePhoto) data.photoUrl = null;

    const updated = await this.commentRepository.update(commentId, data);
    await invalidatePlaceDetailCache(this.cache, comment.placeId);
    return updated;
  }

  async deleteComment({ commentId, userId, requesterRole }) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    if (comment.userId !== userId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu yorumu silme yetkiniz yok');
    }

    await this.commentRepository.delete(commentId);
    await invalidatePlaceDetailCache(this.cache, comment.placeId);
  }

  async toggleHelpful({ commentId, userId }) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }

    const existing = await this.commentRepository.findHelpfulVote(commentId, userId);
    if (existing) {
      await this.commentRepository.removeHelpfulVote(commentId, userId);
    } else {
      await this.commentRepository.addHelpfulVote(commentId, userId);
    }

    return this.commentRepository.findById(commentId, userId);
  }

  async setPinned({ commentId, pinned }) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }

    const updated = await this.commentRepository.setPinned(commentId, pinned);
    await invalidatePlaceDetailCache(this.cache, comment.placeId);
    return updated;
  }

  async reportComment({ commentId, userId, reason }) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    if (comment.userId === userId) {
      throw new ForbiddenError('Kendi yorumunuzu raporlayamazsınız');
    }
    if (reason && reason.length > MAX_REPORT_REASON_LENGTH) {
      throw new ValidationError(`Rapor sebebi en fazla ${MAX_REPORT_REASON_LENGTH} karakter olabilir`);
    }

    const existing = await this.commentRepository.findReport(commentId, userId);
    if (existing) {
      throw new ConflictError('Bu yorumu zaten raporladınız');
    }

    await this.commentRepository.createReport({ commentId, userId, reason: reason || null });
  }

  async listReportedComments() {
    return this.commentRepository.findReportedComments();
  }

  async dismissReports({ commentId }) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    await this.commentRepository.dismissReports(commentId);
  }
}

module.exports = CommentsService;

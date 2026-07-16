const CommentRepository = require('../domain/CommentRepository');
const Comment = require('../domain/Comment');

const USER_SELECT = { id: true, name: true };
const BASE_INCLUDE = {
  user: { select: USER_SELECT },
  _count: { select: { helpfulVotes: true } },
};

function withViewer(viewerId) {
  if (viewerId == null) return BASE_INCLUDE;
  return {
    ...BASE_INCLUDE,
    helpfulVotes: { where: { userId: viewerId }, select: { id: true } },
  };
}

function toEntity(record, viewerId) {
  if (!record) return null;
  return new Comment({
    id: record.id,
    placeId: record.placeId,
    userId: record.userId,
    content: record.content,
    photoUrl: record.photoUrl,
    isPinned: record.isPinned,
    pinnedAt: record.pinnedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    user: record.user,
    helpfulCount: record._count?.helpfulVotes ?? 0,
    isHelpfulByViewer: viewerId != null && Array.isArray(record.helpfulVotes) && record.helpfulVotes.length > 0,
  });
}

class CommentsRepository extends CommentRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findByPlace(placeId, viewerId) {
    const records = await this.prisma.comment.findMany({
      where: { placeId },
      include: withViewer(viewerId),
      orderBy: [{ isPinned: 'desc' }, { pinnedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return records.map((record) => toEntity(record, viewerId));
  }

  async findById(id, viewerId) {
    const record = await this.prisma.comment.findUnique({
      where: { id },
      include: withViewer(viewerId),
    });
    return toEntity(record, viewerId);
  }

  async create(data) {
    const record = await this.prisma.comment.create({ data, include: BASE_INCLUDE });
    return toEntity(record);
  }

  async update(id, data) {
    const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    const record = await this.prisma.comment.update({
      where: { id },
      data: cleanData,
      include: BASE_INCLUDE,
    });
    return toEntity(record);
  }

  async delete(id) {
    await this.prisma.comment.delete({ where: { id } });
  }

  async setPinned(id, pinned) {
    const record = await this.prisma.comment.update({
      where: { id },
      data: { isPinned: pinned, pinnedAt: pinned ? new Date() : null },
      include: BASE_INCLUDE,
    });
    return toEntity(record);
  }

  async findHelpfulVote(commentId, userId) {
    return this.prisma.commentHelpfulVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
  }

  async addHelpfulVote(commentId, userId) {
    await this.prisma.commentHelpfulVote.create({ data: { commentId, userId } });
  }

  async removeHelpfulVote(commentId, userId) {
    await this.prisma.commentHelpfulVote.delete({
      where: { commentId_userId: { commentId, userId } },
    });
  }

  async findReport(commentId, userId) {
    return this.prisma.commentReport.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
  }

  async createReport(data) {
    return this.prisma.commentReport.create({ data });
  }

  async findReportedComments() {
    const records = await this.prisma.comment.findMany({
      where: { reports: { some: { status: 'PENDING' } } },
      include: {
        user: { select: USER_SELECT },
        place: { select: { id: true, name: true } },
        reports: {
          where: { status: 'PENDING' },
          include: { user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { helpfulVotes: true, reports: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ({
      ...toEntity(record),
      place: record.place,
      reports: record.reports,
      reportCount: record._count.reports,
    }));
  }

  async dismissReports(commentId) {
    await this.prisma.commentReport.updateMany({
      where: { commentId, status: 'PENDING' },
      data: { status: 'DISMISSED' },
    });
  }
}

module.exports = CommentsRepository;

const { commentsService } = require('./comments.container');

function buildPhotoUrl(req) {
  if (!req.file) return undefined;
  return `/uploads/comments/${req.file.filename}`;
}

async function createComment(req, res, next) {
  try {
    const comment = await commentsService.createComment({
      placeId: Number(req.params.id),
      userId: req.user.id,
      content: req.body.content,
      photoUrl: buildPhotoUrl(req),
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function listComments(req, res, next) {
  try {
    const comments = await commentsService.listByPlace({
      placeId: Number(req.params.id),
      viewerId: req.user?.id,
    });
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const updated = await commentsService.updateComment({
      commentId: Number(req.params.id),
      userId: req.user.id,
      content: req.body.content,
      photoUrl: buildPhotoUrl(req),
      removePhoto: req.body.removePhoto === 'true' || req.body.removePhoto === true,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    await commentsService.deleteComment({
      commentId: Number(req.params.id),
      userId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function toggleHelpful(req, res, next) {
  try {
    const updated = await commentsService.toggleHelpful({
      commentId: Number(req.params.id),
      userId: req.user.id,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function pinComment(req, res, next) {
  try {
    const updated = await commentsService.setPinned({ commentId: Number(req.params.id), pinned: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function unpinComment(req, res, next) {
  try {
    const updated = await commentsService.setPinned({ commentId: Number(req.params.id), pinned: false });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function reportComment(req, res, next) {
  try {
    await commentsService.reportComment({
      commentId: Number(req.params.id),
      userId: req.user.id,
      reason: req.body.reason,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function listReportedComments(_req, res, next) {
  try {
    const comments = await commentsService.listReportedComments();
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function dismissReports(req, res, next) {
  try {
    await commentsService.dismissReports({ commentId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createComment,
  listComments,
  updateComment,
  deleteComment,
  toggleHelpful,
  pinComment,
  unpinComment,
  reportComment,
  listReportedComments,
  dismissReports,
};

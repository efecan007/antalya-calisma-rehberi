const { Router } = require('express');
const {
  updateComment,
  deleteComment,
  toggleHelpful,
  pinComment,
  unpinComment,
  reportComment,
} = require('./comments.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');
const { commentPhotoUpload } = require('./upload.middleware');

const router = Router();

router.put('/:id', requireAuth, commentPhotoUpload, updateComment);
router.delete('/:id', requireAuth, deleteComment);
router.post('/:id/helpful', requireAuth, toggleHelpful);
router.post('/:id/report', requireAuth, reportComment);
router.patch('/:id/pin', requireAuth, requireAdmin, pinComment);
router.patch('/:id/unpin', requireAuth, requireAdmin, unpinComment);

module.exports = router;

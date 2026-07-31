const { socialService, storage } = require('./social.container');

// Yüklenen dosyaları storage soyutlaması üzerinden herkese açık URL'lere çevirir.
// Local sürücüde `/uploads/social/...`, firebase sürücüsünde Firebase Storage URL'i
// üretir; controller değişmeden yalnızca storage sağlayıcısı değişir.
async function resolveImageUrls(files) {
  if (!files?.length) return [];
  const results = await Promise.all(files.map((file) => storage.save(file, { folder: 'social' })));
  return results.map((result) => result.url);
}

async function createPost(req, res, next) {
  try {
    const imageUrls = await resolveImageUrls(req.files);
    const post = await socialService.createPost({
      userId: req.user.id,
      caption: req.body.caption,
      imageUrls,
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

async function getFeed(req, res, next) {
  try {
    const posts = await socialService.getFeed({
      viewerId: req.user?.id,
      onlyFollowing: req.query.following === 'true',
      page: req.query.page,
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await socialService.getPost({
      postId: Number(req.params.id),
      viewerId: req.user?.id,
    });
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await socialService.updatePost({
      postId: Number(req.params.id),
      userId: req.user.id,
      caption: req.body.caption,
    });
    res.json(post);
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    await socialService.deletePost({
      postId: Number(req.params.id),
      userId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function likePost(req, res, next) {
  try {
    const result = await socialService.likePost({ postId: Number(req.params.id), userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function unlikePost(req, res, next) {
  try {
    const result = await socialService.unlikePost({ postId: Number(req.params.id), userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listComments(req, res, next) {
  try {
    const comments = await socialService.listComments({ postId: Number(req.params.id) });
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = await socialService.addComment({
      postId: Number(req.params.id),
      userId: req.user.id,
      content: req.body.content,
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    await socialService.deleteComment({
      commentId: Number(req.params.id),
      userId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function followUser(req, res, next) {
  try {
    const result = await socialService.followUser({
      followerId: req.user.id,
      targetUserId: Number(req.params.userId),
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function unfollowUser(req, res, next) {
  try {
    const result = await socialService.unfollowUser({
      followerId: req.user.id,
      targetUserId: Number(req.params.userId),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const result = await socialService.getProfile({
      targetUserId: Number(req.params.userId),
      viewerId: req.user?.id,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const result = await socialService.updateMyProfile({ userId: req.user.id, bio: req.body.bio });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listNotifications(req, res, next) {
  try {
    const notifications = await socialService.listNotifications({ userId: req.user.id });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

async function unreadNotificationCount(req, res, next) {
  try {
    const result = await socialService.unreadNotificationCount({ userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const notification = await socialService.markNotificationRead({
      id: Number(req.params.id),
      userId: req.user.id,
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

// ===================== Admin =====================

async function adminDeletePost(req, res, next) {
  try {
    await socialService.adminDeletePost({ postId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function adminDeleteComment(req, res, next) {
  try {
    await socialService.adminDeleteComment({ commentId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    const result = await socialService.setUserBlocked({ userId: Number(req.params.userId), isBlocked: true });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function unblockUser(req, res, next) {
  try {
    const result = await socialService.setUserBlocked({ userId: Number(req.params.userId), isBlocked: false });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  listComments,
  addComment,
  deleteComment,
  followUser,
  unfollowUser,
  getProfile,
  updateMyProfile,
  listNotifications,
  unreadNotificationCount,
  markNotificationRead,
  adminDeletePost,
  adminDeleteComment,
  blockUser,
  unblockUser,
};

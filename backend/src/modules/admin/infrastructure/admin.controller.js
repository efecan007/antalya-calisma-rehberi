const { adminService } = require('./admin.container');

async function listAllReviews(_req, res, next) {
  try {
    const reviews = await adminService.listAllReviews();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function getDashboard(_req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function listUsers(_req, res, next) {
  try {
    const users = await adminService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await adminService.deleteUser({ id: Number(req.params.id), requesterId: req.user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listAllReviews, getDashboard, listUsers, deleteUser };

const { adminService } = require('./admin.container');

async function listAllReviews(_req, res, next) {
  try {
    const reviews = await adminService.listAllReviews();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

module.exports = { listAllReviews };

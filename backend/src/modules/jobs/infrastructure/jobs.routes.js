const { Router } = require('express');
const {
  listJobs,
  createJob,
  listMyJobs,
  updateJob,
  deleteJob,
  applyToJob,
  listMyApplications,
  decideApplication,
} = require('./jobs.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');
const { requirePremium } = require('../../billing/infrastructure/premium.guard');

const router = Router();

// İş İlanları sosyal bölümün bir parçasıdır; sosyal medya gibi yalnızca aktif
// RemoteRehber Pro üyelerine açıktır. Bu router'a gelen HER istek önce
// requireAuth + requirePremium'dan geçer; premium değilse istemci /pro'ya
// yönlendirilir (premiumRequired: true).
router.use(requireAuth, requirePremium);

// --- Başvurular --- (parametrik /:id ile çakışmaması için üstte)
router.get('/applications/mine', listMyApplications);
router.patch('/applications/:id', decideApplication);

// --- İlanlar ---
router.get('/mine', listMyJobs);
router.get('/', listJobs);
router.post('/', createJob);
router.patch('/:id', updateJob);
router.delete('/:id', deleteJob);
router.post('/:id/apply', applyToJob);

module.exports = router;

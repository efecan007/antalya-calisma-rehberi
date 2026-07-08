const { Router } = require('express');
const { getDashboard, listUsers, deleteUser } = require('./admin.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');
const suggestionsAdminRoutes = require('../../suggestions/infrastructure/suggestions.admin.routes');

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.use('/suggestions', suggestionsAdminRoutes);

module.exports = router;

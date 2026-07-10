const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/infrastructure/auth.routes');
const placesRoutes = require('./modules/places/infrastructure/places.routes');
const reviewsRoutes = require('./modules/reviews/infrastructure/reviews.routes');
const favoritesRoutes = require('./modules/favorites/infrastructure/favorites.routes');
const occupancyRoutes = require('./modules/occupancy/infrastructure/occupancy.routes');
const chatRoutes = require('./modules/chat/infrastructure/chat.routes');
const suggestionsRoutes = require('./modules/suggestions/infrastructure/suggestions.routes');
const adminRoutes = require('./modules/admin/infrastructure/admin.routes');
const { listRegions } = require('./modules/places/infrastructure/places.controller');
const { notFoundHandler, errorMiddleware } = require('./common/filters/error.filter');
const { generalLimiter } = require('./common/guards/rate-limit.guard');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());
  app.use('/api', generalLimiter);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/regions', listRegions);
  app.use('/api/auth', authRoutes);
  app.use('/api/places', placesRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/occupancy', occupancyRoutes);
  app.use('/api/messages', chatRoutes);
  app.use('/api/suggestions', suggestionsRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };

const express = require('express');
const cors = require('cors');

const usersRoutes = require('../../../modules/users/infrastructure/users.routes');
const placesRoutes = require('../../../modules/places/infrastructure/places.routes');
const reviewsRoutes = require('../../../modules/reviews/infrastructure/reviews.routes');
const { listRegions } = require('../../../modules/places/infrastructure/places.controller');
const { notFoundHandler, errorMiddleware } = require('./errorMiddleware');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/regions', listRegions);
  app.use('/api/auth', usersRoutes);
  app.use('/api/places', placesRoutes);
  app.use('/api/reviews', reviewsRoutes);

  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };

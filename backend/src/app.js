const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const placesRoutes = require('./routes/places.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const { listRegions } = require('./controllers/places.controller');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/regions', listRegions);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/reviews', reviewsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

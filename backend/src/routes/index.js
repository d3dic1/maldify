const express = require('express');
const reportsRouter = require('./reports');
const campaignsRouter = require('./campaigns');
const aiRouter = require('./ai');
const analyticsRouter = require('./analytics');
const pacingRouter = require('./pacing');
const authRouter = require('./auth');

const setupRoutes = (apiRouter) => {
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/campaigns', campaignsRouter);
  apiRouter.use('/ai', aiRouter);
  apiRouter.use('/analytics', analyticsRouter);
  apiRouter.use('/pacing', pacingRouter);
  apiRouter.use('/auth', authRouter);

  // Health check route
  apiRouter.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return apiRouter;
};

module.exports = { setupRoutes }; 
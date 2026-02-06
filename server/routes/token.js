const express = require('express');
const router = express.Router();
const { bookToken, getQueue, updateStatus } = require('../controllers/tokenController');
const { getAnalytics, exportReport } = require('../controllers/analyticsController');
const { auth, authorize } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimiter');

// Token Routes
router.post('/book', auth, authorize(['PATIENT']), bookingLimiter, validate(schemas.bookToken), bookToken);
router.get('/queue/:doctorId', getQueue);
router.patch('/:id/status', auth, authorize(['DOCTOR']), updateStatus);

// Analytics Routes (Admin)
router.get('/analytics/opd', auth, authorize(['ADMIN']), getAnalytics);
router.get('/analytics/export', auth, authorize(['ADMIN']), exportReport);

module.exports = router;

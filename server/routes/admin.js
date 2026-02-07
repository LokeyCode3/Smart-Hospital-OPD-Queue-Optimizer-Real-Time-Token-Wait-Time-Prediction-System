const express = require('express');
const router = express.Router();
const { createDoctor } = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');
const { adminLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/admin/doctors
// @desc    Create a new doctor (Admin only)
// @access  Private (Admin)
router.post('/doctors', auth, authorize(['ADMIN']), adminLimiter, createDoctor);

module.exports = router;

const express = require('express');
const router = express.Router();
const { generate, verify, getLatestOtp, getPatientLastOtp } = require('../controllers/consultationOtpController');
const { auth, authorize } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');
const { consultationOtpLimiter } = require('../middleware/rateLimiter');

router.post('/generate', auth, authorize(['DOCTOR']), consultationOtpLimiter, validate(schemas.consultationOtpGenerate), generate);
router.post('/verify', auth, authorize(['DOCTOR']), consultationOtpLimiter, validate(schemas.consultationOtpVerify), verify);
router.get('/latest', auth, authorize(['DOCTOR']), getLatestOtp);
router.get('/patient/last-otp', auth, authorize(['PATIENT']), getPatientLastOtp);

module.exports = router;

const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { validate, schemas } = require('../middleware/validation');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post('/send', otpLimiter, validate(schemas.otpSend), sendOtp);
router.post('/verify', otpLimiter, validate(schemas.otpVerify), verifyOtp);

module.exports = router;

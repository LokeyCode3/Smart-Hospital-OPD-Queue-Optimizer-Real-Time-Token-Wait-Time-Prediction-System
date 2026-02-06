const rateLimit = require('express-rate-limit');

// General Limiter
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (Increased from 100)
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Auth Limiter (Stricter)
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased for testing
  message: { message: 'Too many login attempts from this IP, please try again after an hour' }
});

// Booking Limiter (Prevent spam booking)
exports.bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased for testing
  message: { message: 'Too many booking attempts, please try again later' }
});

// OTP Send Limiter
exports.otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests, please try again later' }
});

// Consultation OTP Generate/Verify Limiter
exports.consultationOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many OTP operations, please try again later' }
});

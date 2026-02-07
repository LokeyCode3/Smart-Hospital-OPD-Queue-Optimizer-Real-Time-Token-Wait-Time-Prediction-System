const express = require('express');
const router = express.Router();
const { 
    register, 
    changePassword, 
    adminLogin, 
    patientLogin, 
    adminForgotPassword, 
    patientForgotPassword, 
    adminResetPassword, 
    patientResetPassword, 
    doctorLogin
} = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { auth } = require('../middleware/authMiddleware');

// Public Registration (Forces Patient Role)
router.post('/register', authLimiter, validate(schemas.register), register);

// Authenticated Actions
router.post('/change-password', auth, changePassword);

// --- PATIENT AUTH ROUTES ---
router.post('/patient/login', authLimiter, validate(schemas.login), patientLogin);
router.post('/patient/forgot-password', authLimiter, patientForgotPassword);
router.post('/patient/reset-password', authLimiter, patientResetPassword);

// --- DOCTOR AUTH ROUTES ---
router.post('/doctor/login', authLimiter, validate(schemas.login), doctorLogin);

// --- ADMIN AUTH ROUTES ---
router.post('/admin/login', authLimiter, validate(schemas.login), adminLogin);
router.post('/admin/forgot-password', authLimiter, adminForgotPassword);
router.post('/admin/reset-password', authLimiter, adminResetPassword);

// --- BACKWARD COMPATIBILITY (Optional, but safer to redirect or alias) ---
// If existing frontend code calls /login, we might want to default to Patient or break it.
// Given strict requirements, it's better to NOT support generic /login to force update.
// However, the `register` function in `authController` calls `res.json({ token ... })` 
// but doesn't use `login` route, so that's fine.

module.exports = router;

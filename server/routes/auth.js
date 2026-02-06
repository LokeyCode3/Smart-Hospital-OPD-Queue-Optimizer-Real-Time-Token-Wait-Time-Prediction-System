const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);

module.exports = router;

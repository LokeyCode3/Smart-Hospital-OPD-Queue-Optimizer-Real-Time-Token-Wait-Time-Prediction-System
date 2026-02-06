const express = require('express');
const router = express.Router();
const { completeConsultation, getPatientHistory, getDoctorHistory, getAnalytics } = require('../controllers/consultationController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.post('/complete', auth, authorize(['DOCTOR']), completeConsultation);
router.get('/patient/history', auth, authorize(['PATIENT']), getPatientHistory);
router.get('/doctor/history', auth, authorize(['DOCTOR']), getDoctorHistory);
router.get('/analytics', auth, authorize(['ADMIN']), getAnalytics);

module.exports = router;

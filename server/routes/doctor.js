const express = require('express');
const router = express.Router();
const { addDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor, getDoctorProfile } = require('../controllers/doctorController');
const { auth, authorize } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');

router.post('/', auth, authorize(['ADMIN']), validate(schemas.addDoctor), addDoctor);
router.get('/', getAllDoctors);
router.get('/profile/me', auth, authorize(['DOCTOR']), getDoctorProfile);
router.get('/:id', getDoctorById);
router.put('/:id', auth, authorize(['ADMIN']), updateDoctor);
router.delete('/:id', auth, authorize(['ADMIN']), deleteDoctor);

module.exports = router;

const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/doctor
// @desc    Add a new doctor (Admin only)
exports.addDoctor = async (req, res) => {
  try {
    const { name, email, password, department, avgConsultTime } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'DOCTOR'
    });
    await user.save();

    // Create Doctor Profile
    const doctor = new Doctor({
      userId: user.id,
      name,
      department,
      avgConsultTime
    });
    await doctor.save();

    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/doctor
// @desc    Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ active: true });
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/doctor/:id
// @desc    Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   PUT /api/doctor/:id
// @desc    Update doctor (Admin only)
exports.updateDoctor = async (req, res) => {
  try {
    const { name, department, avgConsultTime, active } = req.body;
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.name = name || doctor.name;
    doctor.department = department || doctor.department;
    doctor.avgConsultTime = avgConsultTime || doctor.avgConsultTime;
    if (active !== undefined) doctor.active = active;

    await doctor.save();
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   DELETE /api/doctor/:id
// @desc    Delete doctor (Admin only)
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Also remove the user
    await User.findByIdAndDelete(doctor.userId);
    await doctor.deleteOne();

    res.json({ message: 'Doctor removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/doctor/profile/me
// @desc    Get current doctor profile
exports.getDoctorProfile = async (req, res) => {
  try {
    let doctor = await Doctor.findOne({ userId: req.user.id });
    
    // Lazy creation for existing users who are Doctors but missing profile
    if (!doctor) {
       const user = await User.findById(req.user.id);
       if (user && user.role === 'DOCTOR') {
           doctor = new Doctor({
               userId: user.id,
               name: user.name,
               department: 'General Medicine',
               avgConsultTime: 10
           });
           await doctor.save();
       } else {
           return res.status(404).json({ message: 'Doctor profile not found' });
       }
    }
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

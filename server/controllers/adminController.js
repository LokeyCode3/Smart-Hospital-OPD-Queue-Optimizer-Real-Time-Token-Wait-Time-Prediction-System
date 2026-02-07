const Doctor = require('../models/Doctor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   POST /api/admin/doctors
// @desc    Admin creates a new doctor account
exports.createDoctor = async (req, res) => {
  try {
    const { 
        name, 
        email, 
        phone, 
        department, 
        consultationFee, 
        avgConsultTime, 
        opdTimings 
    } = req.body;

    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 2. Generate Temporary Password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    // 3. Create User Account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'DOCTOR',
      mobile: phone,
      mustChangePassword: true // Force password change
    });

    await user.save();

    // 4. Create Doctor Profile
    const doctor = new Doctor({
      userId: user.id,
      name,
      department,
      consultationFee,
      avgConsultTime,
      opdTimings,
      active: true
    });

    await doctor.save();

    // 5. Return credentials to Admin
    res.json({
        message: 'Doctor created successfully',
        doctor: {
            id: doctor.id,
            name: doctor.name,
            email: user.email,
            department: doctor.department
        },
        credentials: {
            email: user.email,
            tempPassword: tempPassword
        }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

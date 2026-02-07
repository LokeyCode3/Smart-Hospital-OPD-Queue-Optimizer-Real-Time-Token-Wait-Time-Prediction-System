const User = require('../models/User');
const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.register = async (req, res) => {
  try {
    console.log('Register Request:', req.body);
    const { name, email, password, role, mobile } = req.body;

    // 1. Lock Down Restricted Roles
    if (role === 'DOCTOR' || role === 'ADMIN') {
      return res.status(403).json({ message: 'Public registration for this role is restricted.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'PATIENT',
      mobile
    });

    await user.save();

    const payload = {
      id: user.id,
      role: user.role
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, mobile: user.mobile } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- HELPER LOGIN ---
const performLogin = async (req, res, expectedRole) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Role Enforcement
    if (user.role !== expectedRole) {
       // Generic error to avoid role enumeration if we want to be super strict, 
       // but "Invalid Credentials" is standard.
       // We must NOT allow Patient to login via Admin route and vice versa.
       console.log(`[AUTH FAIL] Role mismatch. Expected ${expectedRole}, got ${user.role} for ${email}`);
       return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
      id: user.id,
      role: user.role
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                mustChangePassword: user.mustChangePassword 
            } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- HELPER FORGOT PASSWORD ---
const performForgotPassword = async (req, res, expectedRole) => {
  try {
    const { email } = req.body;
    
    // GENERIC RESPONSE to prevent enumeration
    const genericResponse = { message: 'If an account with that email exists, a reset code has been sent.' };

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[AUDIT] Forgot Password: User not found for email ${email}`);
      return res.status(200).json(genericResponse);
    }

    // STRICT: Role Check
    if (user.role !== expectedRole) {
      console.log(`[AUDIT] Forgot Password: Role mismatch. Expected ${expectedRole}, got ${user.role} for ${email}`);
      return res.status(200).json(genericResponse);
    }

    // Check Lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
        console.log(`[AUDIT] Forgot Password: Account locked for ${email}`);
        return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and save
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetPasswordAttempts = 0; // Reset attempts on new token generation
    
    await user.save();

    // Mock Email Service
    console.log(`
    ################################################
    [MOCK EMAIL SERVICE]
    To: ${user.email}
    Subject: ${expectedRole === 'ADMIN' ? 'Admin' : 'Patient'} Password Reset
    Reset Code: ${resetToken}
    
    (In production, this would be a secure link)
    ################################################
    `);

    // Actual Email Service
    const message = `
      You are receiving this email because you (or someone else) has requested the reset of a password.
      
      Your Password Reset OTP is: ${resetToken}
      
      This OTP is valid for 10 minutes.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });
      console.log(`[EMAIL SENT] OTP sent to ${user.email}`);
    } catch (emailError) {
      console.error('Email send failed (Check .env credentials):', emailError.message);
    }

    // Audit Log
    console.log(`[AUDIT] Password reset requested for ${expectedRole} ID: ${user.id} from IP: ${req.ip}`);

    res.status(200).json(genericResponse);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- HELPER RESET PASSWORD ---
const performResetPassword = async (req, res, expectedRole) => {
    try {
        const { token, newPassword } = req.body;
        
        // Hash incoming token
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Role Check (Double check)
        if (user.role !== expectedRole) {
            return res.status(400).json({ message: 'Invalid token for this portal' });
        }

        if (!newPassword || newPassword.length < 6) {
             return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.resetPasswordAttempts = 0;
        user.lockUntil = undefined;
        user.lastPasswordResetAt = Date.now();
        user.mustChangePassword = false;

        await user.save();

        console.log(`[AUDIT] Password reset SUCCESS for ${expectedRole} ID: ${user.id} from IP: ${req.ip}`);

        res.json({ message: 'Password updated successfully. Please login.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- EXPORTED HANDLERS ---

exports.adminLogin = (req, res) => performLogin(req, res, 'ADMIN');
exports.patientLogin = (req, res) => performLogin(req, res, 'PATIENT');
exports.doctorLogin = (req, res) => performLogin(req, res, 'DOCTOR');

exports.adminForgotPassword = (req, res) => performForgotPassword(req, res, 'ADMIN');
exports.patientForgotPassword = (req, res) => performForgotPassword(req, res, 'PATIENT');
// Doctor forgot password? Usually Admin resets it, but if they need self-service...
// For now, only Admin/Patient requested. I'll stick to those.

exports.adminResetPassword = (req, res) => performResetPassword(req, res, 'ADMIN');
exports.patientResetPassword = (req, res) => performResetPassword(req, res, 'PATIENT');

// Keep generic login for backward compatibility if needed, but we should strictly use role-based ones now.
// However, the original `login` function is referenced by `routes/auth.js`.
// We will replace `login` usage in `routes/auth.js`.

// exports.login = ... (Removed/Deprecated)
// exports.forgotPassword = ... (Removed/Deprecated)
// exports.resetPassword = ... (Removed/Deprecated)


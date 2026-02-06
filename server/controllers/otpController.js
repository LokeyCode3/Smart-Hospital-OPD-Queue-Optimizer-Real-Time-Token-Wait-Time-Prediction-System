const PhoneOtp = require('../models/PhoneOtp');
const { generateOtp, hashOtp, compareOtp, sendSms, isValidPhone } = require('../services/otpService');

exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const now = new Date();

    const existing = await PhoneOtp.findOne({ phoneNumber });
    if (existing && existing.lockedUntil && existing.lockedUntil > now) {
      return res.status(429).json({ message: 'Too many wrong attempts. Try later.' });
    }

    const code = generateOtp();
    const otpHash = await hashOtp(code);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    if (existing) {
      existing.otpHash = otpHash;
      existing.expiresAt = expiresAt;
      existing.attempts = 0;
      existing.verified = false;
      existing.usedForBooking = false;
      existing.usedAt = null;
      await existing.save();
    } else {
      const rec = new PhoneOtp({ phoneNumber, otpHash, expiresAt });
      await rec.save();
    }

    await sendSms(phoneNumber, `Your verification code is ${code}`);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const rec = await PhoneOtp.findOne({ phoneNumber });
    if (!rec) return res.status(400).json({ message: 'OTP not found. Please request again.' });

    const now = new Date();
    if (rec.lockedUntil && rec.lockedUntil > now) {
      return res.status(429).json({ message: 'Too many wrong attempts. Try later.' });
    }

    if (rec.expiresAt < now) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    const match = await compareOtp(code, rec.otpHash);
    if (!match) {
      rec.attempts += 1;
      if (rec.attempts >= 5) {
        const lock = new Date(now.getTime() + 15 * 60 * 1000);
        rec.lockedUntil = lock;
      }
      await rec.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    rec.verified = true;
    // rec.otpHash = ''; // Keeping hash to satisfy required validator, reuse prevented by usedForBooking flag
    await rec.save();
    res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

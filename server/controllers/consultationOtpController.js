const ConsultationOtp = require('../models/ConsultationOtp');
const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const { generateOtp, hashOtp, compareOtp } = require('../services/otpService');
const { createNotification } = require('./notificationController');

exports.generate = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    const code = generateOtp();
    const otpHash = await hashOtp(code);

    let rec = await ConsultationOtp.findOne({ tokenId });
    if (rec) {
      rec.otpHash = otpHash;
      rec.expiresAt = expiresAt;
      rec.otpGeneratedAt = now;
      rec.verified = false;
      rec.attempts = 0;
      await rec.save();
    } else {
      rec = new ConsultationOtp({ tokenId, otpHash, expiresAt, otpGeneratedAt: now });
      await rec.save();
    }

    const io = req.app.get('io');
    if (token.patientId) {
      io.to(token.patientId.toString()).emit('consultationOtp', { tokenId, code });
      await createNotification(token.patientId, 'Your consultation verification code is generated.', 'INFO');
    }

    token.status = 'PENDING_VERIFICATION';
    await token.save();
    io.to(token.doctorId.toString()).emit('queueUpdate', { type: 'STATUS_UPDATE', token });

    res.json({ message: 'Consultation OTP generated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.verify = async (req, res) => {
  try {
    const { tokenId, code, diagnosis, problem } = req.body;
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    const rec = await ConsultationOtp.findOne({ tokenId });
    if (!rec) return res.status(400).json({ message: 'Consultation OTP not found' });

    const now = new Date();
    if (rec.expiresAt < now) {
      return res.status(400).json({ message: 'Consultation OTP expired' });
    }
    if (rec.verified) {
      return res.status(400).json({ message: 'Consultation already verified' });
    }
    const match = await compareOtp(code, rec.otpHash);
    if (!match) {
      rec.attempts += 1;
      await rec.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    rec.verified = true;
    await rec.save();

    // Note: We do NOT mark token as DONE here anymore. 
    // The doctor must submit notes to /api/consultations/complete to finalize.

    res.json({ message: 'Consultation verified', verified: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getLatestOtp = async (req, res) => {
  try {
    const { tokenId } = req.query;
    if (!tokenId) return res.status(400).json({ message: 'Token ID required' });

    const rec = await ConsultationOtp.findOne({ tokenId });
    if (!rec) return res.json({ status: 'NONE' });

    const now = new Date();
    let status = 'GENERATED';
    if (rec.verified) status = 'VERIFIED';
    else if (rec.expiresAt < now) status = 'EXPIRED';

    res.json({
      status,
      generatedAt: rec.otpGeneratedAt || rec.createdAt,
      expiresAt: rec.expiresAt,
      verified: rec.verified
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPatientLastOtp = async (req, res) => {
  try {
    const patientId = req.user.id;
    // Find latest token
    const token = await Token.findOne({ patientId }).sort({ createdAt: -1 });
    
    if (!token) return res.json({ status: 'NONE' });

    const rec = await ConsultationOtp.findOne({ tokenId: token._id });
    if (!rec) return res.json({ status: 'NONE' });

    const now = new Date();
    let status = 'GENERATED';
    if (rec.verified) status = 'VERIFIED';
    else if (rec.expiresAt < now) status = 'EXPIRED';

    res.json({
      status,
      generatedAt: rec.otpGeneratedAt || rec.createdAt,
      expiresAt: rec.expiresAt,
      verified: rec.verified
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

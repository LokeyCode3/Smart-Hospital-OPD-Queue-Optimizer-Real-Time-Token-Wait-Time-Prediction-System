const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Payment = require('../models/Payment');
const { createNotification } = require('./notificationController');
const crypto = require('crypto');

// Helper: Calculate Dynamic Wait Time
const calculateDynamicWaitTime = async (doctor) => {
  // Use moving average from doctor model or fallback
  return doctor.avgConsultTime;
};

// @route   POST /api/token/book
// @desc    Book a token
exports.bookToken = async (req, res) => {
  try {
    const { doctorId, patientName, priority, reason, visitDate, patientAge, patientGender, patientMobile } = req.body;
    const patientId = req.user ? req.user.id : null;

    // 1. Check User Cooldown (No-Show Penalty)
    if (patientId) {
      const user = await User.findById(patientId);
      if (user.bookingCooldownUntil && user.bookingCooldownUntil > new Date()) {
        return res.status(403).json({ 
          message: `Booking suspended until ${user.bookingCooldownUntil.toLocaleTimeString()} due to frequent no-shows.` 
        });
      }
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Require phone OTP verification before booking
    if (!patientMobile) {
      return res.status(400).json({ message: 'Mobile number is required for booking' });
    }
    const PhoneOtp = require('../models/PhoneOtp');
    const phoneRec = await PhoneOtp.findOne({ phoneNumber: patientMobile });
    if (!phoneRec || !phoneRec.verified) {
      return res.status(403).json({ message: 'Phone verification required before booking' });
    }
    if (phoneRec.usedForBooking) {
      return res.status(403).json({ message: 'OTP already used for booking' });
    }

    // 2. Generate Token Number based on Visit Date
    const dateOfVisit = visitDate ? new Date(visitDate) : new Date();
    const startOfDay = new Date(dateOfVisit);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateOfVisit);
    endOfDay.setHours(23, 59, 59, 999);

    const todayTokensCount = await Token.countDocuments({
      doctorId,
      visitDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const tokenNumber = todayTokensCount + 1;

    const token = new Token({
      patientName,
      patientId,
      doctorId,
      tokenNumber,
      priority: priority || 'NORMAL',
      reason,
      visitDate: dateOfVisit,
      patientAge,
      patientGender,
      patientMobile
    });

    await token.save();
    phoneRec.usedForBooking = true;
    phoneRec.usedAt = new Date();
    await phoneRec.save();

    // 3. Smart Suggestion Logic (Based on TODAY's Queue)
    const activeQueueCount = await Token.countDocuments({
      doctorId,
      status: { $in: ['WAITING', 'IN_PROGRESS'] },
      visitDate: { $gte: startOfDay, $lte: endOfDay }
    });

    let suggestion = null;
    if (activeQueueCount > 5) { // Threshold
      const alternatives = await Doctor.find({
        department: doctor.department,
        _id: { $ne: doctorId },
        active: true
      });
      
      // Simple heuristic: pick first with lower queue
      for (let alt of alternatives) {
        const altQueue = await Token.countDocuments({
          doctorId: alt._id,
          status: { $in: ['WAITING', 'IN_PROGRESS'] },
          visitDate: { $gte: startOfDay, $lte: endOfDay }
        });
        if (altQueue < 5) {
          suggestion = {
            doctorName: alt.name,
            doctorId: alt._id,
            waitTime: altQueue * alt.avgConsultTime,
            message: `Dr. ${doctor.name} has a long wait. Dr. ${alt.name} is available sooner.`
          };
          break;
        }
      }
    }

    // 4. Notification & Real-time
    const io = req.app.get('io');
    io.to(doctorId).emit('queueUpdate', { type: 'NEW_TOKEN', token });
    
    if (patientId) {
      await createNotification(patientId, `Token #${tokenNumber} booked successfully for Dr. ${doctor.name}`, 'SUCCESS');
      // Emit to user specific room if we had one, for now they poll or get general update
    }

    // 5. Audit Log
    if (patientId) {
        const audit = new AuditLog({
            action: 'BOOK_TOKEN',
            performedBy: patientId,
            details: { tokenNumber, doctorId }
        });
        await audit.save();
    }

    res.json({ token, suggestion, waitTime: activeQueueCount * doctor.avgConsultTime });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   POST /api/token/book-emergency
// @desc    Book an emergency token with payment verification
exports.bookEmergencyToken = async (req, res) => {
  try {
    const { 
      doctorId, patientName, reason, visitDate, patientAge, patientGender, patientMobile,
      razorpay_order_id, razorpay_payment_id, razorpay_signature 
    } = req.body;
    
    const patientId = req.user ? req.user.id : null;

    // 1. Verify Payment Signature
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Payment details missing' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // 2. Find Payment and Update
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
        return res.status(404).json({ message: 'Payment order not found' });
    }
    
    if (payment.status === 'PAID') {
         // Already processed, idempotent check
         if (payment.tokenId) {
             const existingToken = await Token.findById(payment.tokenId);
             return res.json({ token: existingToken, message: 'Token already booked for this payment' });
         }
    }

    payment.status = 'PAID';
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    await payment.save();

    // 3. Book Token
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const dateOfVisit = visitDate ? new Date(visitDate) : new Date();
    const startOfDay = new Date(dateOfVisit);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateOfVisit);
    endOfDay.setHours(23, 59, 59, 999);

    const todayTokensCount = await Token.countDocuments({
      doctorId,
      visitDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const tokenNumber = todayTokensCount + 1;

    const token = new Token({
      patientName,
      patientId,
      doctorId,
      tokenNumber,
      priority: 'EMERGENCY',
      isEmergency: true,
      reason,
      visitDate: dateOfVisit,
      patientAge,
      patientGender,
      patientMobile,
      paymentStatus: 'PAID',
      consultationFee: payment.amount,
      paymentId: payment._id,
      status: 'WAITING'
    });

    await token.save();

    // Link Token to Payment
    payment.tokenId = token._id;
    await payment.save();

    // 4. Notifications
    const io = req.app.get('io');
    io.to(doctorId).emit('queueUpdate', { type: 'NEW_TOKEN', token });
    
    if (patientId) {
      await createNotification(patientId, `EMERGENCY Token #${tokenNumber} booked!`, 'SUCCESS');
    }

    // 5. Audit Log
    if (patientId) {
        const audit = new AuditLog({
            action: 'BOOK_EMERGENCY_TOKEN',
            performedBy: patientId,
            details: { tokenNumber, doctorId, paymentId: payment._id }
        });
        await audit.save();
    }

    res.json({ token, message: 'Emergency Token Booked Successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error: ' + err.message);
  }
};

// @route   GET /api/queue/:doctorId
// @desc    Get live queue for a doctor (TODAY ONLY)
exports.getQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tokens = await Token.find({
      doctorId,
      status: { $in: ['WAITING', 'IN_PROGRESS'] },
      visitDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('patientId', 'name noShowCount'); 
    
    // Sort Logic
    tokens.sort((a, b) => {
      if (a.status === 'IN_PROGRESS') return -1;
      if (b.status === 'IN_PROGRESS') return 1;
      if (a.priority === 'EMERGENCY' && b.priority === 'NORMAL') return -1;
      if (b.priority === 'NORMAL' && a.priority === 'EMERGENCY') return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json(tokens);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @route   PATCH /api/token/:id/status
// @desc    Update token status (Doctor only)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'IN_PROGRESS', 'DONE', 'NO_SHOW'
    const token = await Token.findById(req.params.id);

    if (!token) return res.status(404).json({ message: 'Token not found' });

    const oldStatus = token.status;
    token.status = status;
    const now = new Date();

    // 1. Dynamic Time Logic
    if (status === 'IN_PROGRESS') {
      token.startTime = now;
      
      // Notify this patient
      if (token.patientId) {
        await createNotification(token.patientId, `Your turn with Dr. is starting now!`, 'ALERT');
      }
      
      // Notify NEXT patient (Queue Position 1)
      // Find who is next
      const nextToken = await Token.findOne({
          doctorId: token.doctorId,
          status: 'WAITING',
          _id: { $ne: token._id }
      }).sort({ createdAt: 1 }); // Simplified sort
      
      if (nextToken && nextToken.patientId) {
         await createNotification(nextToken.patientId, `You are next in line! Please be ready.`, 'INFO');
      }
    }

    if (status === 'DONE') {
       // Logic moved to Consultation Complete usually, but if done here:
       // Update doctor stats, etc.
    }

    await token.save();
    
    // Emit update
    const io = req.app.get('io');
    io.to(token.doctorId.toString()).emit('queueUpdate', { type: 'STATUS_UPDATE', token });

    res.json(token);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

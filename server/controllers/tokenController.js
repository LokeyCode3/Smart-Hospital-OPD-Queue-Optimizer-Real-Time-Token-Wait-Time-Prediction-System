const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { createNotification } = require('./notificationController');

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
          await createNotification(nextToken.patientId, `You are next in line!`, 'WARNING');
          const io = req.app.get('io');
          // Emit specific event to next user if we had user sockets, or generic queue update handles it
      }

    } else if (status === 'DONE') {
      return res.status(400).json({ message: 'Consultation OTP verification required to mark DONE' });
    } else if (status === 'NO_SHOW') {
        // Handle No Show
        if (token.patientId) {
            const user = await User.findById(token.patientId);
            user.noShowCount += 1;
            
            // Penalty: If > 3 no-shows, 24h cooldown
            if (user.noShowCount >= 3) {
                const cooldown = new Date();
                cooldown.setHours(cooldown.getHours() + 24);
                user.bookingCooldownUntil = cooldown;
                user.noShowCount = 0; // Reset or keep incrementing? Let's reset cycle.
                await createNotification(user._id, `You have been marked as No-Show multiple times. Booking suspended for 24h.`, 'ALERT');
            } else {
                await createNotification(user._id, `You missed your appointment. Please cancel in advance next time.`, 'WARNING');
            }
            await user.save();
        }
    }

    await token.save();

    // 2. Real-time update
    const io = req.app.get('io');
    io.to(token.doctorId.toString()).emit('queueUpdate', { type: 'STATUS_UPDATE', token });

    // 3. Audit Log
    const audit = new AuditLog({
        action: `TOKEN_${status}`,
        performedBy: req.user.id,
        details: { tokenId: token._id, oldStatus, newStatus: status }
    });
    await audit.save();

    res.json(token);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

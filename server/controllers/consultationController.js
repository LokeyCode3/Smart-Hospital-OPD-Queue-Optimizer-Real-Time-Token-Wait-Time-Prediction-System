const Consultation = require('../models/Consultation');
const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const ConsultationOtp = require('../models/ConsultationOtp');
const User = require('../models/User');

// @route   POST /api/consultations/complete
// @desc    Complete consultation with notes after OTP verification
exports.completeConsultation = async (req, res) => {
  try {
    const { tokenId, visitReason, problemCategory, doctorNotes } = req.body;

    // 1. Verify Token and OTP Status
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    const otpRec = await ConsultationOtp.findOne({ tokenId });
    if (!otpRec || !otpRec.verified) {
      return res.status(400).json({ message: 'Consultation OTP not verified yet' });
    }

    // 2. Calculate Timings
    const endTime = new Date();
    token.endTime = endTime;
    if (!token.startTime) {
      // Fallback if startTime wasn't set (should ideally be set when status -> IN_PROGRESS)
      token.startTime = new Date(endTime.getTime() - 10 * 60 * 1000); 
    }
    const durationMins = (token.endTime - token.startTime) / 60000;
    token.duration = durationMins;
    token.status = 'DONE';
    await token.save();

    // 3. Update Doctor Stats
    const doctor = await Doctor.findById(token.doctorId);
    if (doctor) {
      doctor.avgConsultTime = ((doctor.avgConsultTime * 9) + durationMins) / 10;
      doctor.consultationHistory.push({ duration: durationMins, timestamp: endTime });
      if (doctor.consultationHistory.length > 50) doctor.consultationHistory.shift();
      await doctor.save();
    }

    // 4. Create Consultation Record
    const consultation = new Consultation({
      patientId: token.patientId,
      doctorId: token.doctorId,
      tokenId: token._id,
      department: doctor ? doctor.department : 'General',
      visitReason: visitReason || token.reason,
      problemCategory,
      doctorNotes,
      consultationStartTime: token.startTime,
      consultationEndTime: token.endTime,
      consultationDuration: durationMins,
      otpVerified: true,
      date: endTime
    });
    await consultation.save();

    // 5. Notify Client
    const io = req.app.get('io');
    io.to(token.doctorId.toString()).emit('queueUpdate', { type: 'STATUS_UPDATE', token });

    res.json({ message: 'Consultation completed successfully', consultation });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @route   GET /api/consultations/patient/history
// @desc    Get patient appointment history
exports.getPatientHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = { patientId };
    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const history = await Consultation.find(query)
      .populate('doctorId', 'name department')
      .sort({ date: -1 });

    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @route   GET /api/consultations/doctor/history
// @desc    Get doctor's consultation history with filters
exports.getDoctorHistory = async (req, res) => {
  try {
    // Need to find the doctor ID associated with the logged-in user
    // The auth middleware gives us req.user.id (User ID).
    // We need to look up the Doctor document where userId matches.
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: req.user.id });
    
    if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const { startDate, endDate, problemCategory } = req.query;

    let query = { doctorId: doctor._id };
    
    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (problemCategory && problemCategory !== 'All') {
        query.problemCategory = problemCategory;
    }

    const history = await Consultation.find(query)
      .populate('patientId', 'name email') // Get patient details
      .sort({ date: -1 });

    res.json({
        count: history.length,
        history
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @route   GET /api/consultations/analytics
// @desc    Get admin analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate && endDate) {
        dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = { date: { $gte: thirtyDaysAgo } };
    }

    // 1. Total Consultations
    const totalConsultations = await Consultation.countDocuments(dateFilter);

    // 2. Problem Category Distribution
    const categoryDist = await Consultation.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$problemCategory', count: { $sum: 1 } } }
    ]);

    // 3. Avg Duration per Doctor
    const avgDuration = await Consultation.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$doctorId', avgTime: { $avg: '$consultationDuration' } } },
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
        { $unwind: '$doctor' },
        { $project: { name: '$doctor.name', avgTime: 1 } }
    ]);

    // 4. No-Show vs Completed (Need to query Token collection for No-Show)
    // We can't get No-Show from Consultation as it only stores completed ones.
    // So we query Token collection for this part.
    // Assuming dateFilter applies to visitDate in Token
    const tokenFilter = {};
    if (startDate && endDate) {
        tokenFilter.visitDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const noShowCount = await Token.countDocuments({ ...tokenFilter, status: 'NO_SHOW' });
    const completedCount = await Token.countDocuments({ ...tokenFilter, status: 'DONE' });

    res.json({
        totalConsultations,
        categoryDist,
        avgDuration,
        statusRatio: { completed: completedCount, noShow: noShowCount }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

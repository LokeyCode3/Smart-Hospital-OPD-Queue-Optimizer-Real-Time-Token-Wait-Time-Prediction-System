const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const { Parser } = require('json2csv');
// const PDFDocument = require('pdfkit'); // For PDF, we'll implement if requested, keeping it simple first.

exports.getAnalytics = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalTokens = await Token.countDocuments({ createdAt: { $gte: startOfDay } });
    
    // Revenue & Emergency Stats
    const emergencyTokens = await Token.countDocuments({ 
        createdAt: { $gte: startOfDay },
        priority: 'EMERGENCY'
    });
    
    const normalTokens = await Token.countDocuments({ 
        createdAt: { $gte: startOfDay },
        priority: 'NORMAL'
    });

    const revenueResult = await Token.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$consultationFee' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Doctor Stats
    const doctors = await Doctor.find({ active: true });
    const doctorStats = await Promise.all(doctors.map(async (doc) => {
      const queueLength = await Token.countDocuments({
        doctorId: doc._id,
        status: { $in: ['WAITING', 'IN_PROGRESS'] }
      });
      return {
        doctor: doc.name,
        department: doc.department,
        queueLength,
        avgWaitTime: Math.round(queueLength * doc.avgConsultTime)
      };
    }));

    // Peak Hours (Simple aggregation by hour)
    const tokens = await Token.find({ createdAt: { $gte: startOfDay } });
    const peakHours = {};
    tokens.forEach(t => {
      const hour = new Date(t.createdAt).getHours();
      peakHours[hour] = (peakHours[hour] || 0) + 1;
    });

    res.json({
      totalTokens,
      emergencyTokens,
      normalTokens,
      totalRevenue,
      doctorStats,
      peakHours
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type } = req.query; // 'csv' or 'pdf' (ignoring pdf for now, treating as csv or json)
    
    const tokens = await Token.find().populate('doctorId', 'name department').populate('patientId', 'name');
    
    const fields = ['tokenNumber', 'patientName', 'priority', 'status', 'createdAt', 'doctorId.name', 'doctorId.department'];
    const opts = { fields };
    
    if (type === 'csv') {
      const parser = new Parser(opts);
      const csv = parser.parse(tokens);
      res.header('Content-Type', 'text/csv');
      res.attachment('opd_report.csv');
      return res.send(csv);
    }

    res.json(tokens);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

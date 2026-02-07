const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Doctor = require('../models/Doctor');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for consultation fee
exports.createOrder = async (req, res) => {
  try {
    const { doctorId } = req.body;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const amount = doctor.consultationFee * 100; // Convert to paise
    const currency = 'INR';

    const options = {
      amount: amount,
      currency: currency,
      receipt: `receipt_${Date.now()}_${doctorId.toString().slice(-4)}`
    };

    const order = await razorpay.orders.create(options);

    // Save initial payment record
    const payment = new Payment({
      orderId: order.id,
      amount: doctor.consultationFee,
      currency: currency,
      status: 'CREATED',
      doctorId: doctorId,
      patientId: req.user ? req.user.id : null
    });
    
    await payment.save();

    res.json({
      ...order,
      key: process.env.RAZORPAY_KEY_ID, // Send key to frontend
      amount: amount,
      currency: currency,
      name: 'Smart Hospital',
      description: `Consultation with ${doctor.name}`,
      prefill: {
        name: req.user ? req.user.name : '',
        email: req.user ? req.user.email : '',
        contact: req.user ? req.user.mobile : '' // Assuming user has mobile
      }
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ message: 'Payment order creation failed', error: error.message });
  }
};

// @route   POST /api/payments/verify
// @desc    Verify Razorpay signature (Optional standalone verification)
exports.verifyPayment = async (req, res) => {
  // This is optional if verification happens during booking
  // But useful for debugging or separate verification flow
  res.status(200).json({ message: 'Verification endpoint ready' });
};

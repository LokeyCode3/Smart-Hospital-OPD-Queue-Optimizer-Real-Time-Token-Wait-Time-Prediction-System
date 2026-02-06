const bcrypt = require('bcryptjs');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const compareOtp = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

const sendSms = async (phoneNumber, message) => {
  console.log(`[SMS MOCK] To: ${phoneNumber} | ${message}`);
};

const isValidPhone = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
  sendSms,
  isValidPhone
};

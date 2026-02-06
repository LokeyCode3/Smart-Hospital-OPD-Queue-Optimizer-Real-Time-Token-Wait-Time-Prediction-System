const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  console.log('Validating Request Body:', req.body);
  const { error } = schema.validate(req.body);
  if (error) {
    console.log('Validation Error:', error.details[0].message);
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const schemas = {
  register: Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'DOCTOR', 'PATIENT')
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  bookToken: Joi.object({
    doctorId: Joi.string().required(),
    priority: Joi.string().valid('NORMAL', 'EMERGENCY').default('NORMAL'),
    patientName: Joi.string().optional(),
    reason: Joi.string().optional(),
    visitDate: Joi.date().optional(),
    patientAge: Joi.number().optional(),
    patientGender: Joi.string().valid('Male', 'Female', 'Other').optional(),
    patientMobile: Joi.string().optional()
  }),
  addDoctor: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    department: Joi.string().required(),
    avgConsultTime: Joi.number().min(1).required()
  }),
  otpSend: Joi.object({
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required()
  }),
  otpVerify: Joi.object({
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    code: Joi.string().length(6).required()
  }),
  consultationOtpGenerate: Joi.object({
    tokenId: Joi.string().required()
  }),
  consultationOtpVerify: Joi.object({
    tokenId: Joi.string().required(),
    code: Joi.string().length(6).required(),
    diagnosis: Joi.string().allow('').optional(),
    problem: Joi.string().allow('').optional()
  })
};

module.exports = { validate, schemas };

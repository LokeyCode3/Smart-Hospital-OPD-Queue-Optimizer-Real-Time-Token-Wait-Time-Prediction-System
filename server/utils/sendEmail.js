const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  // For Gmail, you might need an App Password if 2FA is on
  // Service: 'gmail' sets host to smtp.gmail.com and port to 465 (secure) automatically
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Smart Hospital'}" <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html // Optional: if you want to send HTML email
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

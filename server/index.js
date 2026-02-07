const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Connect Database
connectDB();

// Middleware
app.use(helmet()); // Security Headers
app.use(cors());
app.use(express.json());
app.use(generalLimiter); // Rate limiting global

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Smart Hospital API</title></head>
      <body style="background-color: #10121b; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <div style="text-align: center; padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.05);">
          <h1>Smart Hospital API is Running 🚀</h1>
          <p>Status: <span style="color: #4cc9f0;">Active</span> | Port: <span style="color: #4cc9f0;">${process.env.PORT || 5001}</span></p>
          <p style="margin-top: 20px;">Use the Frontend Application to interact:</p>
          <a href="http://localhost:5173" style="display: inline-block; padding: 10px 20px; background: #3a6df0; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">Go to App (localhost:5173)</a>
        </div>
      </body>
    </html>
  `);
});

// Socket.IO
app.set('io', io); 

io.on('connection', (socket) => {
  console.log('New client connected: ' + socket.id);

  socket.on('joinDoctorRoom', (doctorId) => {
    socket.join(doctorId);
  });
  
  // Also join user room for personal notifications
  // In a real app, client should emit 'joinUserRoom' with their userId after auth
  socket.on('joinUserRoom', (userId) => {
      socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/token', require('./routes/token'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/consultation-otp', require('./routes/consultationOtp'));
app.use('/api/consultations', require('./routes/consultation'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

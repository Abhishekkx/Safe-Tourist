const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend development
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  })
);

// Allow large media/voice note payloads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e8, // 100MB buffer for WebSocket media
});

app.set('io', io);

// Socket.io Connection Event Handlers
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket.io stream: ${socket.id}`);

  // Handle live continuous GPS location stream updates
  socket.on('UPDATE_LIVE_LOCATION', (data) => {
    io.emit('TOURIST_LOCATION_STREAM', data);
  });

  // Handle authority broadcast emergency alerts
  socket.on('BROADCAST_SAFETY_ALERT', (alertData) => {
    console.log('🚨 Authority Emergency Alert Broadcast:', alertData);
    io.emit('SAFETY_ALERT_BROADCAST', alertData);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Register API Routes
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Smart Tourist Safety Platform API Engine',
    timestamp: new Date().toISOString(),
  });
});

// Connect to MongoDB Atlas (or fallback to memory store)
connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Smart Tourist Safety Backend Server running on http://localhost:${PORT}`);
});

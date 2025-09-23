require('dotenv').config();

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Memory monitoring
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
  });
}, 30000);

// Automated cleanup of past bookings at midnight
const { cleanupPastBookings } = require('./helpers/cleanupPastBookings');

// Function to schedule daily cleanup at midnight
function scheduleCleanup() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  
  const timeToMidnight = midnight.getTime() - now.getTime();
  
  console.log(`[${now.toISOString()}] Scheduling next cleanup in ${Math.round(timeToMidnight / 1000 / 60)} minutes`);
  
  setTimeout(() => {
    cleanupPastBookings();
    // Schedule next cleanup (every 24 hours)
    setInterval(cleanupPastBookings, 24 * 60 * 60 * 1000);
  }, timeToMidnight);
}

// Start the cleanup scheduler
scheduleCleanup();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Attach io instance to app
app.set('io', io);

// Socket.io setup
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  connectedUsers.set(socket.id, socket);

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.disconnect(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    connectedUsers.delete(socket.id);
    socket.removeAllListeners();
  });
});

// API routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/buildings', require('./routes/building'));
  app.use('/api/floors', require('./routes/floor'));
  app.use('/api/bookings', require('./routes/bookings')); // ✅ Confirmed route
  app.use('/api/rooms', require('./routes/availability'));
  app.use('/api/admin', require('./routes/admin')); // ✅ Admin routes
} catch (error) {
  console.error('Error loading routes:', error);
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Classroom Allocation Backend Running',
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');

  try {
    server.close(() => {
      console.log('HTTP server closed');
    });

    connectedUsers.forEach((socket) => {
      socket.disconnect(true);
    });
    connectedUsers.clear();

    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Memory limit: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB used`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
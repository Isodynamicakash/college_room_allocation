const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Find user
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Verify password
  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create JWT
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Return token and user info
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name
    }
  });
});

module.exports = router;
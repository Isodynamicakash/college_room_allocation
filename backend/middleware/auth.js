const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'No token provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization header format' });
  }

  const token = parts[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded._id || decoded.id;
    if (!userId) return res.status(401).json({ message: 'Invalid token payload' });

    req.user = {
      id: String(userId),
      name: decoded.name || null,
      role: decoded.role || 'user',
      ...decoded
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message || err);
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = auth;
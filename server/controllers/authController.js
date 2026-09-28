const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tourist_safety_jwt_key_2026';

// POST /api/auth/login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hardcoded default admin for effortless hackathon demo & testing
    if ((username === 'admin' && password === 'admin123') || (username === 'responder' && password === 'safe2026')) {
      const token = jwt.sign(
        { id: 'admin-01', username, role: 'DISPATCHER', department: 'Emergency Command Center' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Responder authentication successful.',
        token,
        user: {
          username,
          role: 'DISPATCHER',
          department: 'Emergency Command Center',
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid responder credentials. (Use admin / admin123)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

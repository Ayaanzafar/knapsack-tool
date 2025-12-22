const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it-in-production';

// Verify Token Middleware
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Fallback: Check body or query (useful for form submissions/downloads)
  if (!token) {
    token = req.body.token || req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Check for Mandatory Password Change
exports.checkPasswordChange = (req, res, next) => {
  if (req.user.mustChangePassword && req.path !== '/change-password' && req.path !== '/logout') {
    return res.status(403).json({ 
      error: 'Password change required', 
      code: 'PASSWORD_CHANGE_REQUIRED' 
    });
  }
  next();
};

// Role-based Access Control Middleware
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Access denied: No role assigned' });
    }

    // Advanced users (DESIGN, MANAGER) have access to most things
    // If 'ADVANCED' is passed, allow DESIGN and MANAGER
    const effectiveAllowedRoles = allowedRoles.flatMap(role => 
      role === 'ADVANCED' ? ['DESIGN', 'MANAGER'] : [role]
    );

    if (!effectiveAllowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied: Requires ${effectiveAllowedRoles.join(' or ')} role` });
    }

    next();
  };
};

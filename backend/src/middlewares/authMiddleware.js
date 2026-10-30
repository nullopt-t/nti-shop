import jwt from 'jsonwebtoken';

export function managerAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const accessKeyHeader = req.headers['x-manager-key'];
  const expectedKey = process.env.MANAGER_ACCESS_KEY || 'manager123';
  const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey_sprint01_2026';

  // Direct access key header check (allows direct key usage in scripts/curl)
  if (accessKeyHeader && accessKeyHeader === expectedKey) {
    req.manager = { role: 'manager', method: 'key' };
    return next();
  }

  // Bearer JWT token check
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.manager = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired manager session token',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. Manager authentication required.',
  });
}

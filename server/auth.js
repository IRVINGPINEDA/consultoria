const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const parseAuthHeader = (req) => {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m ? m[1] : null;
};

const requireAuth = (req, res, next) => {
  const token = parseAuthHeader(req);
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
};

const requireRole = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ error: "unauthorized" });
  if (!roles.includes(role)) return res.status(403).json({ error: "forbidden" });
  return next();
};

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  requireRole,
};


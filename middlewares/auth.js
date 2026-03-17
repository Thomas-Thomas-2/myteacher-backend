const jwt = require("jsonwebtoken");

function getTokenFromReq(req) {
  // cookie first
  if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
  // fallback dev/tests: Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function authMiddleware(req, res, next) {
  try {
    const token = getTokenFromReq(req);
    if (!token)
      return res.status(401).json({ result: false, error: "Unauthorized" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role }
    return next();
  } catch (e) {
    return res.status(401).json({ result: false, error: "Unauthorized" });
  }
}

module.exports = authMiddleware;

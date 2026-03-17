const jwt = require("jsonwebtoken");

function getTokenFromSocket(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake.headers?.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

function socketAuthMiddleware(socket, next) {
  try {
    const token = getTokenFromSocket(socket);

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
}

module.exports = socketAuthMiddleware;

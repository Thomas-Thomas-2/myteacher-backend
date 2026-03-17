require("dotenv").config();
require("./models/connection");

const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const registerMessagingSocket = require("./socket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://myteacher-frontend-three.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

registerMessagingSocket(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

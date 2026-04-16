require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const prisma = require("./config/database");
const { initSocket } = require("./socket/index");
const { setIo } = require("./socket/ioInstance");

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    setIo(io);
    initSocket(io);

    server.listen(PORT, () => {
      const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
      console.log(`🚀 Server running at ${baseUrl} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

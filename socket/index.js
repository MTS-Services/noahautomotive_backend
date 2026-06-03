const jwt = require("jsonwebtoken");

// Map userId → Set of socket IDs (a user can have multiple tabs/devices)
const onlineUsers = new Map();

const initSocket = (io) => {
  // ── JWT authentication middleware ─────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });
  // ── Handle socket connections ─────────────────────────────────────────────

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Track online user
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Each user joins their own room so we can target them by userId
    socket.join(`user:${userId}`);

    console.log(`[Socket] ${userId} connected (${socket.id})`);

    // Notify others this user is online
    socket.broadcast.emit("user:online", { userId });

    // ── Client joins a conversation room ──────────────────────────────────
    socket.on("conversation:join", (conversationId) => {
      if (typeof conversationId === "string") {
        socket.join(`conv:${conversationId}`);
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      if (typeof conversationId === "string") {
        socket.leave(`conv:${conversationId}`);
      }
    });

    // ── Typing indicators ─────────────────────────────────────────────────
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user:offline", { userId });
        }
      }
      console.log(`[Socket] ${userId} disconnected (${socket.id})`);
    });
  });
};

// Check if a user is currently online
const isUserOnline = (userId) => onlineUsers.has(userId);

module.exports = { initSocket, isUserOnline };

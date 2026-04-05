const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authenticate } = require("../middleware/auth");
const { chatUpload } = require("../middleware/upload");

// All message routes require authentication (USER and VENDOR)
router.use(authenticate);

// Start or get existing 1-on-1 conversation
router.post("/conversations", messageController.startOrGetConversation);

// List all conversations for the logged-in user
router.get("/conversations", messageController.getConversations);

// Get messages inside a conversation (paginated)
router.get("/conversations/:id", messageController.getConversationMessages);

// Send a message (text, image, video, or text + media)
router.post(
  "/conversations/:id",
  chatUpload.single("media"),
  messageController.sendMessage,
);

// Mark all received messages in a conversation as read
router.put("/conversations/:id/read", messageController.markAsRead);

module.exports = router;

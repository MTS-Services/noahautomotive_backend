const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authenticate } = require("../middleware/auth");
const { chatUpload } = require("../middleware/upload");

router.use(authenticate);

router.post("/conversations", messageController.startOrGetConversation);

router.get("/conversations", messageController.getConversations);

router.get("/conversations/:id", messageController.getConversationMessages);

router.post(
  "/conversations/:id",
  chatUpload.single("media"),
  messageController.sendMessage,
);

router.put("/conversations/:id/read", messageController.markAsRead);

module.exports = router;

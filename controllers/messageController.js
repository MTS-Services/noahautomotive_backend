const messageService = require("../services/messageService");
const { buildFileUrl } = require("../utils/helpers");
const { getIo } = require("../socket/ioInstance");
const path = require("path");

const IMAGE_EXT = /jpeg|jpg|png|webp/;
const VIDEO_EXT = /mp4|mov|avi|mkv|webm/;

const startOrGetConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId || typeof receiverId !== "string" || !receiverId.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "receiverId is required" });
    }
    const { conversation, isNew } = await messageService.startOrGetConversation(
      req.user.id,
      receiverId.trim(),
    );
    res.status(isNew ? 201 : 200).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await messageService.getConversations(req.user.id);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const result = await messageService.getConversationMessages(
      id,
      req.user.id,
      page,
      limit,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = req.body.content ? req.body.content.trim() : null;

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      const ext = path
        .extname(req.file.originalname)
        .toLowerCase()
        .replace(".", "");
      mediaType = IMAGE_EXT.test(ext) ? "image" : "video";
      mediaUrl = buildFileUrl(`chat/${req.file.filename}`);
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Message must have content or a media file",
      });
    }

    const message = await messageService.sendMessage(
      id,
      req.user.id,
      content,
      mediaUrl,
      mediaType,
    );

    // Real-time: push the new message to everyone in the conversation room
    try {
      getIo()
        .to(`conv:${id}`)
        .emit("message:new", { conversationId: id, message });
      // Also ping the recipient's personal room in case they haven't joined the conv room yet
      if (message.receiverId) {
        getIo()
          .to(`user:${message.receiverId}`)
          .emit("message:new", { conversationId: id, message });
      }
    } catch (_) {}

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await messageService.markAsRead(id, req.user.id);

    // Real-time: notify the conversation that messages were read
    try {
      getIo()
        .to(`conv:${id}`)
        .emit("message:read", { conversationId: id, readBy: req.user.id });
    } catch (_) {}

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startOrGetConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
};

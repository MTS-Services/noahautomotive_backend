const prisma = require("../config/database");
const { paginate, buildPaginationMeta } = require("../utils/helpers");

const getConversationDetail = async (conversationId, currentUserId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              profileImage: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUserId,
  );

  const unreadCount = await prisma.message.count({
    where: { conversationId, receiverId: currentUserId, isRead: false },
  });

  return {
    id: conversation.id,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    otherUser: otherParticipant?.user ?? null,
    lastMessage: conversation.messages[0] ?? null,
    unreadCount,
  };
};

const startOrGetConversation = async (currentUserId, receiverId) => {
  if (currentUserId === receiverId) {
    const err = new Error("You cannot start a conversation with yourself");
    err.statusCode = 400;
    throw err;
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!receiver) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (!receiver.isActive) {
    const err = new Error("This user's account is deactivated");
    err.statusCode = 403;
    throw err;
  }

  // Find existing 1-on-1 conversation between these two users
  const myConversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: currentUserId } } },
    include: { participants: true },
  });

  const existing = myConversations.find(
    (c) =>
      c.participants.length === 2 &&
      c.participants.some((p) => p.userId === receiverId),
  );

  if (existing) {
    return {
      conversation: await getConversationDetail(existing.id, currentUserId),
      isNew: false,
    };
  }

  const created = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: currentUserId }, { userId: receiverId }],
      },
    },
  });

  return {
    conversation: await getConversationDetail(created.id, currentUserId),
    isNew: true,
  };
};

const getConversations = async (userId) => {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    orderBy: { conversation: { updatedAt: "desc" } },
    select: { conversationId: true },
  });

  const conversations = await Promise.all(
    participations.map((p) => getConversationDetail(p.conversationId, userId)),
  );

  return conversations;
};

const getConversationMessages = async (conversationId, userId) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!participant) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { id: true, fullName: true, profileImage: true, role: true },
      },
    },
  });

  return { messages };
};

const sendMessage = async (
  conversationId,
  senderId,
  content,
  mediaUrl,
  mediaType,
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });

  if (!conversation) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const isParticipant = conversation.participants.some(
    (p) => p.userId === senderId,
  );
  if (!isParticipant) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const receiverParticipant = conversation.participants.find(
    (p) => p.userId !== senderId,
  );
  const receiverId = receiverParticipant.userId;

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        content: content || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        senderId,
        receiverId,
        conversationId,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, profileImage: true, role: true },
        },
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return msg;
  });

  return message;
};

const markAsRead = async (conversationId, userId) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!participant) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const { count } = await prisma.message.updateMany({
    where: { conversationId, receiverId: userId, isRead: false },
    data: { isRead: true },
  });

  return { markedRead: count };
};

module.exports = {
  startOrGetConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
};

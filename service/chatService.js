const prisma = require("../config/prismaConfig");
const admin = require("../config/firebaseConfig");






const resolveChatRoomId = (payload = {}) =>
  payload.chatroom ||
  payload.chatroomId ||
  payload.chatRoomId ||
  payload.chatRoom ||
  payload.chat_room ||
  payload.id ||
  null;


const getSenderDisplayName = (messageRecord) => {
  if (messageRecord?.senderUser) {
    const { firstName, lastName } = messageRecord.senderUser;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return fullName || "User";
  }

  if (messageRecord?.senderBarber) {
    return messageRecord.senderBarber.name || "Barber";
  }

  if (messageRecord?.senderAdmin) {
    return messageRecord.senderAdmin.name || messageRecord.senderAdmin.email || "Admin";
  }

  return "Someone";
};

const buildChatParticipants = (chatRoomData) => [
  {
    id: chatRoomData.userId,
    type: "USER",
    profile: chatRoomData.user,
  },
  {
    id: chatRoomData.adminId,
    type: "ADMIN",
    profile: chatRoomData.admin,
  },
  {
    id: chatRoomData.barberId,
    type: "BARBER",
    profile: chatRoomData.barber,
  },
].filter((participant) => Boolean(participant.id));

const sendMessage = async (io, socket, data = {}) => {
  try {
    const { message } = data;
    const chatroomId = resolveChatRoomId(data);
    const senderId = socket.userId;

    console.log(senderId, 'senderid');

    const senderType = socket.userType;


    console.log(senderType, 'senderType');

    if (!chatroomId) {
      return io.to(senderId).emit("message", {
        status: "error",
        message: "Chat room id is required"
      });
    }

    if (!message || !message.trim()) {
      return io.to(senderId).emit("message", {
        status: "error",
        message: "Message cannot be empty"
      });
    }

    const chatRoomData = await prisma.chatRoom.findUnique({
      where: { id: chatroomId },
      include: {
        user: true,
        barber: true,
        admin: true
      }
    });

    if (!chatRoomData) {
      return io.to(senderId).emit("message", {
        status: "error",
        message: "Chat room not found"
      });
    }

    const isParticipant =
      chatRoomData.userId === senderId ||
      chatRoomData.adminId === senderId ||
      chatRoomData.barberId === senderId;

    if (!isParticipant) {
      return io.to(senderId).emit("message", {
        status: "error",
        message: "You are not a participant in this chat room"
      });
    }

    const messageData = {
      content: message,
      chatRoomId: chatroomId,
      isRead: false, // ✅ Unread by default
      senderUserId: senderType === "USER" ? senderId : null,
      senderAdminId: senderType === "ADMIN" ? senderId : null,
      senderBarberId: senderType === "BARBER" ? senderId : null
    };

    const newMessage = await prisma.message.create({
      data: messageData,
      include: {
        senderUser: {
          select: { id: true, firstName: true, lastName: true, image: true }
        },
        senderAdmin: {
          select: { id: true, name: true, email: true }
        },
        senderBarber: {
          select: { id: true, name: true, phoneNumber: true }
        }
      }
    });

    // Update chatRoom's updatedAt to sort chats by last activity
    await prisma.chatRoom.update({
      where: { id: chatroomId },
      data: { updatedAt: new Date() }
    });

    // Emit message to all participants
    const participants = buildChatParticipants(chatRoomData);

    const trimmedContent = message.trim();
    const messagePreview =
      trimmedContent.length > 120
        ? `${trimmedContent.slice(0, 117)}...`
        : trimmedContent;
    const senderDisplayName = getSenderDisplayName(newMessage);
    const notificationTitle = "New chat message";
    const notificationBody = `${senderDisplayName}: ${messagePreview}`;

    const notificationJobs = [];
    const pushJobs = [];

    for (const participant of participants) {
      io.to(participant.id).emit("message", {
        status: "success",
        message: "Message sent successfully",
        data: newMessage
      });

      try {
        const summary = await getRoomsSummary(participant.id);
        io.to(participant.id).emit("rooms:summary", {
          status: "success",
          data: summary
        });
      } catch (summaryErr) {
        console.error("rooms:summary refresh error:", summaryErr);
        io.to(participant.id).emit("rooms:summary", {
          status: "error",
          message: "Failed to refresh summary"
        });
      }

      if (participant.id === senderId) {
        continue;
      }

      if (participant.type === "USER") {
        notificationJobs.push({
          // type: participant.type,
          id: participant.id,
          promise: prisma.userNotification.create({
            data: {
              userId: participant.id,
              title: notificationTitle,
              description: notificationBody
            }
          })
        });
      } else if (participant.type === "BARBER") {
        notificationJobs.push({
          // type: participant.type,
          id: participant.id,
          promise: prisma.barberNotification.create({
            data: {
              barberId: participant.id,
              title: notificationTitle,
              description: notificationBody
            }
          })
        });
      }

      const deviceToken = participant.profile?.deviceToken;
      if (deviceToken) {
        pushJobs.push({
          // type: participant.type,
          id: participant.id,
          promise: admin.messaging().send({
            token: deviceToken,
            notification: {
              title: notificationTitle,
              body: notificationBody
            },
            data: {
              chatRoomId: chatroomId,
              messageId: newMessage.id,
              senderId,
              senderType
            }
          })
        });
      }
    }

    if (notificationJobs.length) {
      const results = await Promise.allSettled(notificationJobs.map((job) => job.promise));
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const { type, id } = notificationJobs[index];
          console.error(`Failed to persist ${type} chat notification for ${id}:`, result.reason);
        }
      });
    }

    if (pushJobs.length) {
      const results = await Promise.allSettled(pushJobs.map((job) => job.promise));
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const { type, id } = pushJobs[index];
          console.error(`Failed to send push notification to ${type} ${id}:`, result.reason);
        }
      });
    }

  } catch (err) {
    console.error("sendMessage error:", err);
    io.to(socket.userId).emit("message", {
      status: "error",
      message: "Internal server error"
    });
  }
};


const getChatRoomData = async (socket, data = {}) => {
  try {
    const userId = socket.userId;
    const chatroomId = resolveChatRoomId(data);

    if (!chatroomId) {
      return socket.emit("getRoom", {
        status: "error",
        message: "Chat room id is required"
      });
    }

    const chatRoomData = await prisma.chatRoom.findUnique({
      where: { id: chatroomId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, image: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        },
        barber: {
          select: { id: true, name: true, phoneNumber: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            senderUser: {
              select: { id: true, firstName: true, lastName: true, image: true }
            },
            senderAdmin: {
              select: { id: true, name: true }
            },
            senderBarber: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    });

    if (!chatRoomData) {
      return socket.emit("getRoom", {
        status: "error",
        message: "Chat room not found"
      });
    }

    const isParticipant =
      chatRoomData.userId === userId ||
      chatRoomData.adminId === userId ||
      chatRoomData.barberId === userId;

    if (!isParticipant) {
      return socket.emit("getRoom", {
        status: "error",
        message: "You are not a participant in this chat room"
      });
    }

    // ✅ Mark unread messages as read where this user is not the sender
    const { count: markedAsRead } = await prisma.message.updateMany({
      where: {
        chatRoomId: chatroomId,
        isRead: false,
        AND: [
          {
            OR: [
              { senderUserId: null },
              { senderUserId: { not: userId } }
            ]
          },
          {
            OR: [
              { senderAdminId: null },
              { senderAdminId: { not: userId } }
            ]
          },
          {
            OR: [
              { senderBarberId: null },
              { senderBarberId: { not: userId } }
            ]
          }
        ]
      },
      data: {
        isRead: true
      }
    });

    console.log(`Marked ${markedAsRead} messages as read for user ${userId} in room ${chatroomId}`);

    // 🔁 Optionally fetch updated messages (with isRead: true now)
    const refreshedMessages = await prisma.message.findMany({
      where: { chatRoomId: chatroomId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        senderUser: {
          select: { id: true, firstName: true, lastName: true, image: true }
        },
        senderAdmin: {
          select: { id: true, name: true }
        },
        senderBarber: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    return socket.emit("getRoom", {
      status: "success",
      data: {
        ...chatRoomData,
        messages: refreshedMessages
      }
    });

  } catch (err) {
    console.error("getChatRoomData error:", err);
    return socket.emit("getRoom", {
      status: "error",
      message: "Internal server error"
    });
  }
};

const getRoomsSummary = async (userId) => {
  // 1) All rooms where this user is a participant
  const rooms = await prisma.chatRoom.findMany({
    where: {
      OR: [{ userId }, { adminId: userId }, { barberId: userId }]
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      userId: true,
      adminId: true,
      barberId: true,
      // Last message preview
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          isRead: true,
          senderUserId: true,
          senderAdminId: true,
          senderBarberId: true
        }
      },
      // Show counterpart info as needed for list UI
      user: { select: { id: true, firstName: true, lastName: true, image: true } },
      admin: { select: { id: true, name: true, email: true } },
      barber: { select: { id: true, name: true, image: true } }
    }
  });

  if (rooms.length === 0) return [];

  const unreadCounts = await Promise.all(
    rooms.map(room =>
      prisma.message.count({
        where: {
          chatRoomId: room.id,
          isRead: false,
          AND: [
            {
              OR: [
                { senderUserId: null },
                { senderUserId: { not: userId } }
              ]
            },
            {
              OR: [
                { senderAdminId: null },
                { senderAdminId: { not: userId } }
              ]
            },
            {
              OR: [
                { senderBarberId: null },
                { senderBarberId: { not: userId } }
              ]
            }
          ]
        }
      })
    )
  );

  const unreadMap = new Map(rooms.map((room, idx) => [room.id, unreadCounts[idx]]));

  console.log(unreadMap, 'unreadMap');


  // 3) Shape response
  return rooms.map(r => ({
    chatroomId: r.id,
    lastMessage: r.messages[0]?.content ?? null,
    lastMessageAt: r.messages[0]?.createdAt ?? r.updatedAt,
    unread: unreadMap.get(r.id),
    user: r.user,
    admin: r.admin,
    barber: r.barber
  }));
};







module.exports = {
  sendMessage,
  getChatRoomData,
  getRoomsSummary,

}

const prisma = require("../config/prismaConfig");






const sendMessage = async (io, socket, data) => {
  try {
    const { chatroom, message } = data;
    const senderId = socket.userId;
    const senderType = socket.userType;

    console.log(senderType, 'senderType');

    if (!message || !message.trim()) {
      return io.to(senderId).emit("message", {
        status: "error",
        message: "Message cannot be empty"
      });
    }

    const chatRoomData = await prisma.chatRoom.findUnique({
      where: { id: chatroom },
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
      chatRoomId: chatroom,
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
      where: { id: chatroom },
      data: { updatedAt: new Date() }
    });

    // Emit message to all participants
    const participants = [chatRoomData.userId, chatRoomData.adminId, chatRoomData.barberId].filter(Boolean);

    participants.forEach((participantId) => {
      io.to(participantId).emit("message", {
        status: "success",
        message: "Message sent successfully",
        data: newMessage
      });

      // Emit separate event for unread count refresh
      // io.to(participantId).emit("roomUpdated", {
      //   chatRoomId: chatroom
      // });
    });

  } catch (err) {
    console.error("sendMessage error:", err);
    io.to(socket.userId).emit("message", {
      status: "error",
      message: "Internal server error"
    });
  }
};


const getChatRoomData = async (socket, data) => {
  try {
    const userId = socket.userId;
    const userType = socket.userType;
    const chatroomId = data.chatroom;

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
    const notSenderCondition = {};
    if (userType === 'USER') {
      notSenderCondition.senderUserId = userId;
    } else if (userType === 'ADMIN') {
      notSenderCondition.senderAdminId = userId;
    } else if (userType === 'BARBER') {
      notSenderCondition.senderBarberId = userId;
    }

    await prisma.message.updateMany({
      where: {
        chatRoomId: chatroomId,
        isRead: false,
        // NOT: {
        //   OR: [
        //     { senderUserId: userType === 'USER' ? userId : undefined },
        //     { senderAdminId: userType === 'ADMIN' ? userId : undefined },
        //     { senderBarberId: userType === 'BARBER' ? userId : undefined }
        //   ]
        // }

        OR: [
          {
            AND: [
              { senderUserId: { not: userId } },
              { senderUserId: { not: null } }
            ]
          },
          {
            AND: [
              { senderAdminId: { not: userId } },
              { senderAdminId: { not: null } }
            ]
          },
          {
            AND: [
              { senderBarberId: { not: userId } },
              { senderBarberId: { not: null } }
            ]
          }
        ]
      },
      data: {
        isRead: true
      }
    });

    // 🔁 Optionally fetch updated messages (with isRead: true now)
    const updatedChatRoomData = {
      ...chatRoomData,
      messages: chatRoomData.messages.map(msg => ({
        ...msg,
        isRead: true
      }))
    };

    return socket.emit("getRoom", {
      status: "success",
      data: updatedChatRoomData
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

  const roomIds = rooms.map(r => r.id);

  if (roomIds.length === 0) return [];

  // 2) Unread counts per room
  const unreadGrouped = await prisma.message.groupBy({
    by: ["chatRoomId"],
    where: {
      chatRoomId: { in: roomIds },
      isRead: false,
      NOT: [
        { senderUserId: userId },
        { senderAdminId: userId },
        { senderBarberId: userId }
      ]
    },
    _count: { _all: true }
  });

  const unreadMap = new Map(unreadGrouped.map(g => [g.chatRoomId, g._count._all]));

  // 3) Shape response
  return rooms.map(r => ({
    chatroomId: r.id,
    lastMessage: r.messages[0]?.content ?? null,
    lastMessageAt: r.messages[0]?.createdAt ?? r.updatedAt,
    unread: unreadMap.get(r.id) || 0,
    user: r.user,
    admin: r.admin,
    barber: r.barber
  }));
};

const markRoomRead = async (userId, userType, chatroomId) => {
  // Which sender column corresponds to "this user"?
  let senderField;
  if (userType === "USER") senderField = "senderUserId";
  else if (userType === "ADMIN") senderField = "senderAdminId";
  else if (userType === "BARBER") senderField = "senderBarberId";

  // Only mark messages as read where this user is NOT the sender
  await prisma.message.updateMany({
    where: {
      chatRoomId: chatroomId,
      isRead: false,
      OR: [
        { AND: [{ senderUserId: { not: userId } }, { senderUserId: { not: null } }] },
        { AND: [{ senderAdminId: { not: userId } }, { senderAdminId: { not: null } }] },
        { AND: [{ senderBarberId: { not: userId } }, { senderBarberId: { not: null } }] }
      ]
    },
    data: { isRead: true }
  });

}






module.exports = {
  sendMessage,
  getChatRoomData,
  getRoomsSummary,
  markRoomRead

}
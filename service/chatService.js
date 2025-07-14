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







module.exports = {
  sendMessage,
  getChatRoomData,

}
const prisma = require("../../config/prismaConfig");
const { ConflictError, NotFoundError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");





const createChatRoom = async (req, res, next) => {
  try {
    const { id: requesterId, userType } = req.user;
    const { otherUserId } = req.body;

    // Prevent self-chat
    if (otherUserId === requesterId) {
      throw new ConflictError("You cannot create a chat with yourself.");
    }

    // Determine types of requester
    const requesterIsUser = userType === 'USER';
    const requesterIsAdmin = userType === 'ADMIN';
    const requesterIsBarber = userType === 'BARBER';

    // Check if the other participant exists and their type
    const [user, admin, barber] = await Promise.all([
      prisma.user.findUnique({ where: { id: otherUserId } }),
      prisma.admin.findUnique({ where: { id: otherUserId } }),
      prisma.barber.findUnique({ where: { id: otherUserId } }),
    ]);

    if (!user && !admin && !barber) {
      throw new NotFoundError("The other participant does not exist.");
    }

    const participantIds = {
      userId: requesterIsUser ? requesterId : (user?.id ?? null),
      adminId: requesterIsAdmin ? requesterId : (admin?.id ?? null),
      barberId: requesterIsBarber ? requesterId : (barber?.id ?? null),
    };

    // Check if the chat already exists
    const existingChat = await prisma.chatRoom.findFirst({
      where: participantIds,
      include: {
        user: true,
        admin: true,
        barber: true,
        messages: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (existingChat) {
      return handlerOk(
        res,
        200,
        { chatRoomId: existingChat.id },
        'Chat room already exists'
      );
    }

    // Create a new chat room
    const newChatRoom = await prisma.chatRoom.create({
      data: participantIds,
      include: {
        user: true,
        admin: true,
        barber: true,
        messages: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return handlerOk(
      res,
      200,
      { chatRoomId: newChatRoom.id, chatRoom: newChatRoom },
      'Chat room created successfully'
    );
  } catch (error) {
    next(error);
  }
};





const getChatRoom = async (req, res, next) => {
  try {
    const { id: currentUserId } = req.user;

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { userId: currentUserId },
          { adminId: currentUserId },
          { barberId: currentUserId }
        ]
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, image: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        },
        barber: {
          select: { id: true, name: true, phoneNumber: true, image: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!rooms.length) {
      throw new NotFoundError("No one-to-one chat rooms found.");
    }

    // 🔁 Add unread message count for each room
    const roomsWithUnreadCount = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await prisma.message.count({
          where: {
            chatRoomId: room.id,
            isRead: false,
            OR: [
              {
                AND: [
                  { senderUserId: { not: currentUserId } },
                  { senderUserId: { not: null } }
                ]
              },
              {
                AND: [
                  { senderAdminId: { not: currentUserId } },
                  { senderAdminId: { not: null } }
                ]
              },
              {
                AND: [
                  { senderBarberId: { not: currentUserId } },
                  { senderBarberId: { not: null } }
                ]
              }
            ]
          }

        });

        return {
          ...room,
          unreadCount
        };
      })
    );

    return handlerOk(res, 200, roomsWithUnreadCount, 'One-to-one chat rooms fetched successfully');
  } catch (error) {
    next(error);
  }
};




module.exports = {
  createChatRoom,
  getChatRoom
}

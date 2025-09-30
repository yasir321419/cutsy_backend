const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");



const showAllUserNotification = async (req, res, next) => {
  try {

    const { id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const notifications = await Promise.all([
      prisma.userNotification.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, image: true } } },
        skip,
        take: limit,
      })
    ])

    if (notifications.length === 0) {
      throw new NotFoundError("notifications not found")
    }


    handlerOk(res, 200, notifications, 'notifications found successfully')



  } catch (error) {
    next(error)
  }
}

const readUserNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.userNotification.findUnique({
      where: {
        id: notificationId
      }
    });

    if (!notification) {
      throw new NotFoundError("notification id not found")
    }

    const readnotification = await prisma.userNotification.update({
      where: {
        id: notification.id
      },
      data: {
        isRead: true
      }
    });

    if (!readnotification) {
      throw new ValidationError("notification is not read")
    }

    handlerOk(res, 200, readnotification, 'notification read successfully')


  } catch (error) {
    next(error)
  }
}

const onAndOffUserNotification = async (req, res, next) => {
  try {
    let { notificationOnAndOff, id } = req.user;

    notificationOnAndOff = !notificationOnAndOff;

    let message = notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    await prisma.user.update({
      where: {
        id: id
      },
      data: {
        notificationOnAndOff: notificationOnAndOff
      }
    })

    handlerOk(res, 200, null, message)

  } catch (error) {
    next(error)
  }
}

module.exports = {
  showAllUserNotification,
  readUserNotification,
  onAndOffUserNotification
}
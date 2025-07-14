const prisma = require("../../config/prismaConfig");
const { NotFoundError, ConflictError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const saveUserAddress = async (req, res, next) => {
  try {
    const { latitude, longitude, address, addressLine1, addressLine2, city, state, country, postalcode } = req.body;
    const { id } = req.user;
    const existaddress = await prisma.userAddress.findFirst({
      where: {
        latitude,
        longitude,
        addressName: address,
        addressLine1,
        addressLine2,
        city,
        states: state,
        country,
        postalCode: postalcode,
        createdById: id
      }
    });

    if (existaddress) {
      throw new ConflictError("address already exist")
    }

    const saveaddress = await prisma.userAddress.create({
      data: {
        latitude,
        longitude,
        addressName: address,
        addressLine1,
        addressLine2,
        city,
        states: state,
        country,
        postalCode: postalcode,
        createdById: id
      }
    });

    if (!saveaddress) {
      throw new ValidationError("address not save")
    }

    handlerOk(res, 200, saveaddress, "address saved successfully");

  } catch (error) {
    next(error)
  }
}

const showUserSaveAddress = async (req, res, next) => {
  try {
    const { id } = req.user;


    const finduseraddress = await prisma.userAddress.findMany({
      where: {
        createdById: id
      }
    });

    if (finduseraddress.length === 0) {
      throw new NotFoundError("user address not found")
    }

    handlerOk(res, 200, finduseraddress, "user address found successfully");

  } catch (error) {
    next(error)
  }
}


module.exports = {
  saveUserAddress,
  showUserSaveAddress
}
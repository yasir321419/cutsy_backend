const prisma = require("../../config/prismaConfig");
const { ValidationError, ConflictError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const adminCreateHairType = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.user;

    const existingHairType = await prisma.hairType.findFirst({
      where: {
        name,
        createdById: id
      }
    });

    if (existingHairType) {
      throw new ConflictError("hair type already exist")
    }

    const newHairType = await prisma.hairType.create({
      data: {
        name,
        createdById: id
      }
    });

    if (!newHairType) {
      throw new ValidationError("hair type not create")
    }

    handlerOk(res, 200, newHairType, "hair type created successfully");

  } catch (error) {
    next(error)
  }
}

const adminShowHairType = async (req, res, next) => {
  try {
    const { id } = req.user;

    let hairTypes;


    if (req.user && req.user.id) {
      hairTypes = await prisma.hairType.findMany({
        where: {
          createdById: id
        }
      })
    } else {
      hairTypes = await prisma.hairType.findMany()
    }

    if (hairTypes.length === 0) {
      throw new NotFoundError("no hair type found")
    }

    handlerOk(res, 200, hairTypes, "hair types found successfully")

  } catch (error) {
    next(error)
  }
}

const adminUpdateHairType = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { name } = req.body;
    const { hairTypeId } = req.params;

    const findhairtype = await prisma.hairType.findUnique({
      where: {
        id: hairTypeId,
        createdById: id
      }
    });

    if (!findhairtype) {
      throw new NotFoundError("hair type not found")
    }

    const updateHairType = await prisma.hairType.update({
      where: {
        id: findhairtype.id,
        createdById: id
      },
      data: {
        name
      }
    });

    if (!updateHairType) {
      throw new ValidationError("hair type not updated")
    }

    handlerOk(res, 200, updateHairType, "hair type updated successfully");


  } catch (error) {
    next(error)
  }
}

const adminDeleteHairType = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { hairTypeId } = req.params;

    const findhairtype = await prisma.hairType.findUnique({
      where: {
        id: hairTypeId,
        createdById: id
      }
    });

    if (!findhairtype) {
      throw new NotFoundError("hair type not found")
    }

    const deleteHairType = await prisma.hairType.delete({
      where: {
        id: findhairtype.id,
        createdById: id
      }
    });

    if (!deleteHairType) {
      throw new ValidationError("hair type not deleted")
    }

    handlerOk(res, 200, null, "hair type deleted successfully");
  } catch (error) {
    next(error)
  }
}

const adminCreateHairLength = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.user;

    const existingHairLength = await prisma.hairLength.findFirst({
      where: {
        name,
        createdById: id
      }
    });

    if (existingHairLength) {
      throw new ConflictError("hair Length already exist")
    }

    const newHairLength = await prisma.hairLength.create({
      data: {
        name,
        createdById: id
      }
    });

    if (!newHairLength) {
      throw new ValidationError("hair Length not create")
    }

    handlerOk(res, 200, newHairLength, "hair Length created successfully");

  } catch (error) {
    next(error)
  }
}

const adminShowHairLength = async (req, res, next) => {
  try {
    const { id } = req.user;

    let hairLengths;

    if (req.user && req.user.id) {
      hairLengths = await prisma.hairLength.findMany({
        where: {
          createdById: id
        }
      })
    } else {
      hairLengths = await prisma.hairLength.findMany()
    }


    if (hairLengths.length === 0) {
      throw new NotFoundError("no hair length found")
    }

    handlerOk(res, 200, hairLengths, "hair lengths found successfully")

  } catch (error) {
    next(error)
  }
}

const adminUpdateHairLength = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { name } = req.body;
    const { hairLengthId } = req.params;

    const findhairlength = await prisma.hairLength.findUnique({
      where: {
        id: hairLengthId,
        createdById: id
      }
    });

    if (!findhairlength) {
      throw new NotFoundError("hair length not found")
    }

    const updateHairLength = await prisma.hairLength.update({
      where: {
        id: findhairlength.id,
        createdById: id
      },
      data: {
        name
      }
    });

    if (!updateHairLength) {
      throw new ValidationError("hair length not updated")
    }

    handlerOk(res, 200, updateHairLength, "hair length updated successfully");


  } catch (error) {
    next(error)
  }
}

const adminDeleteHairLength = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { hairLengthId } = req.params;

    const findhairlength = await prisma.hairLength.findUnique({
      where: {
        id: hairLengthId,
        createdById: id
      }
    });

    if (!findhairlength) {
      throw new NotFoundError("hair length not found")
    }

    const deleteHairLength = await prisma.hairLength.delete({
      where: {
        id: findhairlength.id,
        createdById: id
      }
    });

    if (!deleteHairLength) {
      throw new ValidationError("hair length not delete")
    }

    handlerOk(res, 200, null, "hair length deleted successfully");


  } catch (error) {
    next(error)
  }
}


module.exports = {
  adminCreateHairType,
  adminShowHairType,
  adminUpdateHairType,
  adminDeleteHairType,
  adminCreateHairLength,
  adminShowHairLength,
  adminUpdateHairLength,
  adminDeleteHairLength
}
const prisma = require("../../config/prismaConfig");
const { ValidationError, NotFoundError, ConflictError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const adminCreateBarberExperience = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { id } = req.user;

    const existexpirience = await prisma.barberExperience.findFirst({
      where: {
        title,
        description
      }
    });

    if (existexpirience) {
      throw new ConflictError("Experience already exist");
    }
    const barberExperience = await prisma.barberExperience.create({
      data: {
        title,
        description,
        createdById: id
      }
    });

    if (!barberExperience) {
      throw new ValidationError("barber experience not create")
    }

    handlerOk(res, 200, barberExperience, "barber experience created successfully");

  } catch (error) {
    next(error)
  }
}

const adminShowBarberExperience = async (req, res, next) => {
  try {

    let barberexperience;

    if (req.user && req.user.id) {
      const { id } = req.user;

      barberexperience = await prisma.barberExperience.findMany({
        where: {
          createdById: id
        }
      })

    } else {
      barberexperience = await prisma.barberExperience.findMany();
    }

    if (barberexperience.length === 0) {
      throw new NotFoundError("barber experience not found")
    }

    handlerOk(res, 200, barberexperience, "barber experience found successfully")
  } catch (error) {
    next(error)
  }
}

const adminUpdateBarberExperience = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { id } = req.user;
    const { experienceId } = req.params;
    const findexperience = await prisma.barberExperience.findUnique({
      where: {
        id: experienceId,
        createdById: id
      }
    });

    if (!findexperience) {
      throw new NotFoundError("barber experience not found")
    }

    const updatedexperience = await prisma.barberExperience.update({
      where: {
        id: findexperience.id,
        createdById: id
      },
      data: {
        title,
        description
      }
    });

    if (!updatedexperience) {
      throw new ValidationError("barber experience not update")
    }

    handlerOk(res, 200, updatedexperience, "barber experience updated successfully")
  } catch (error) {
    next(error)
  }
}

const adminDeleteBarberExperience = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { experienceId } = req.params;

    const findexperience = await prisma.barberExperience.findUnique({
      where: {
        id: experienceId,
        createdById: id
      }
    });

    if (!findexperience) {
      throw new NotFoundError("barber experience not found")
    }

    const deleteexpirience = await prisma.barberExperience.delete({
      where: {
        id: findexperience.id,
      }
    });

    if (!deleteexpirience) {
      throw new ValidationError("barber experience not delete")
    }

    handlerOk(res, 200, null, "barber experience deleted successfully")

  } catch (error) {
    next(error)
  }
}

module.exports = {
  adminCreateBarberExperience,
  adminShowBarberExperience,
  adminUpdateBarberExperience,
  adminDeleteBarberExperience
}
const prisma = require("../../config/prismaConfig");
const { ConflictError, ValidationError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showAllUsers = async (req, res, next) => {
  try {
    const findusers = await prisma.user.findMany({});

    if (findusers.length === 0) {
      throw new NotFoundError("no user found");
    }

    handlerOk(res, 200, findusers, 'users found successfully');
  } catch (error) {
    next(error)
  }
}

const showAllBarbers = async (req, res, next) => {
  try {
    const findbarbers = await prisma.barber.findMany({});

    if (findbarbers.length === 0) {
      throw new NotFoundError("no barber found");
    }

    handlerOk(res, 200, findbarbers, 'barbers found successfully');
  } catch (error) {
    next(error)
  }
}

const countUsers = async (req, res, next) => {
  try {

    const countusers = await prisma.user.count({});

    const countbarbers = await prisma.barber.count({});

    const totaluser = countusers + countbarbers;


    if (totaluser.length === 0) {
      throw new NotFoundError("no user and barber found");
    }
    handlerOk(res, 200, totaluser, 'users and barbers count successfully');
  } catch (error) {
    next(error)
  }
}

const androidUsers = async (req, res, next) => {
  try {
    const findandriodusers = await prisma.user.count({
      where: {
        "deviceType": "ANDROID"
      }
    });

    const findandriodbarbers = await prisma.barber.count({
      where: {
        "deviceType": "ANDROID"
      }
    });

    const totaluser = findandriodusers + findandriodbarbers;
    if (totaluser.length === 0) {
      throw new NotFoundError("no android user found");

    }
    handlerOk(res, 200, totaluser, 'android users found successfully');

  } catch (error) {
    next(error)
  }
}

const iosUsers = async (req, res, next) => {
  try {
    const findiosusers = await prisma.user.count({
      where: {
        "deviceType": "IOS"
      }
    });

    const findiosbarver = await prisma.barber.count({
      where: {
        "deviceType": "IOS"
      }
    });

    const totaliosusers = findiosusers + findiosbarver;

    if (totaliosusers.length === 0) {
      throw new NotFoundError("no ios users found");
    }

    handlerOk(res, 200, totaliosusers, 'ios users found successfully')
  } catch (error) {
    next(error)
  }
}

const createPrivacyPolicy = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { text } = req.body;

    const existPrivacy = await prisma.privacyPolicy.findFirst({
      where: {
        text,
        createdById: id
      }
    });

    if (existPrivacy) {
      throw new ConflictError("privacy policy already exist")
    }

    const createprivacy = await prisma.privacyPolicy.create({
      data: {
        text,
        createdById: id
      }
    });

    if (!createprivacy) {
      throw new ValidationError("privacy policy not create")
    }

    handlerOk(res, 200, createprivacy, "privacy policy created successfully");


  } catch (error) {
    next(error)
  }
}

const showPrivacyPolicy = async (req, res, next) => {

  try {

    let showprivacy;

    if (req.user && req.user.id) {
      const { id } = req.user;

      showprivacy = await prisma.privacyPolicy.findFirst({
        where: {
          createdById: id
        }
      })
    } else {
      showprivacy = await prisma.privacyPolicy.findFirst()
    }

    if (!showprivacy) {
      throw new NotFoundError("privacy policy not found")
    }

    handlerOk(res, 200, showprivacy, "privacy policy found successfully")


  } catch (error) {
    next(error)
  }
}

const updatePrivacyPolicy = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { privacyId } = req.params;
    const { text } = req.body;

    const findprivacy = await prisma.privacyPolicy.findUnique({
      where: {
        id: privacyId,
        createdById: id
      }
    });

    if (!findprivacy) {
      throw new NotFoundError("privacy policy not found")
    }

    const updateprivacy = await prisma.privacyPolicy.update({
      where: {
        id: findprivacy.id
      },
      data: {
        text
      }
    });

    if (!updateprivacy) {
      throw new ValidationError("privacy policy not update")
    }

    handlerOk(res, 200, updateprivacy, "privacy policy updated successfully");

  } catch (error) {
    next(error)
  }
}


const createTermsCondition = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { text } = req.body;

    const existTerms = await prisma.termsCondition.findFirst({
      where: {
        text,
        createdById: id
      }
    });

    if (existTerms) {
      throw new ConflictError("terms and condition already exist")
    }

    const createterms = await prisma.termsCondition.create({
      data: {
        text,
        createdById: id
      }
    });

    if (!createterms) {
      throw new ValidationError("terms and condition not create")
    }

    handlerOk(res, 200, createterms, "terms and condition created successfully");


  } catch (error) {
    next(error)
  }
}

const showTermsCondtion = async (req, res, next) => {
  try {

    let showterms;

    if (req.user && req.user.id) {
      const { id } = req.user;

      showterms = await prisma.termsCondition.findFirst({
        where: {
          createdById: id
        }
      })
    } else {
      showterms = await prisma.termsCondition.findFirst()
    }

    if (!showterms) {
      throw new NotFoundError("terms and condition not found")
    }

    handlerOk(res, 200, showterms, "terms and condition found successfully")


  } catch (error) {
    next(error)
  }
}

const updateTermsCondition = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { termsId } = req.params;
    const { text } = req.body;

    const findterms = await prisma.termsCondition.findUnique({
      where: {
        id: termsId,
        createdById: id
      }
    });

    if (!findterms) {
      throw new NotFoundError("terms and condition not found")
    }

    const updateterms = await prisma.termsCondition.update({
      where: {
        id: findterms.id
      },
      data: {
        text
      }
    });

    if (!updateterms) {
      throw new ValidationError("terms and condition not update")
    }

    handlerOk(res, 200, updateterms, "terms and condition updated successfully");

  } catch (error) {
    next(error)
  }
}

module.exports = {
  showAllUsers,
  showAllBarbers,
  countUsers,
  androidUsers,
  iosUsers,
  createPrivacyPolicy,
  showPrivacyPolicy,
  updatePrivacyPolicy,
  createTermsCondition,
  showTermsCondtion,
  updateTermsCondition
}
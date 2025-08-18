const jwt = require("jsonwebtoken");
const {
  BadRequestError,
  UnAuthorizedError,
  NotFoundError,
} = require("../handler/CustomError");
const prisma = require("../config/prismaConfig");
require("dotenv").config();

const verifyUserToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1];
    if (!token || token === "" || token === undefined || token === false) {
      throw new BadRequestError("A token is required for authentication");
    }
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decode, "decode");

    const userId = decode.id;
    const userType = decode.userType;

    const findUser = await prisma.user.findFirst({
      where: {
        id: userId,
        userType: userType,
      },
    });
    if (!findUser) {
      throw new NotFoundError("User Not Found");
    }

    req.user = findUser;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnAuthorizedError("Token has expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new UnAuthorizedError("Token is Invalid"));
    }
    return next(error);
  }
};

const verifyBarberToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1];
    if (!token || token === "" || token === undefined || token === false) {
      throw new BadRequestError("A token is required for authentication");
    }
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decode, "decode");

    const userId = decode.id;
    const userType = decode.userType;

    const findBarber = await prisma.barber.findFirst({
      where: {
        id: userId,
        userType: userType,
      },
    });
    if (!findBarber) {
      throw new NotFoundError("Barber Not Found");
    }

    req.user = findBarber;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnAuthorizedError("Token has expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new UnAuthorizedError("Token is Invalid"));
    }
    return next(error);
  }
};

const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1];
    if (!token || token === "" || token === undefined || token === false) {
      throw new BadRequestError("A token is required for authentication");
    }
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decode, "decode");

    const adminId = decode.id;
    const userType = decode.userType;

    const findAdmin = await prisma.admin.findFirst({
      where: {
        id: adminId,
        userType: userType,
      },
    });

    if (!findAdmin) {
      throw new NotFoundError("Admin Not Found");
    }

    req.user = findAdmin;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnAuthorizedError("Token has expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new UnAuthorizedError("Token is Invalid"));
    }
    return next(error);
  }
};

const optionalAdminAuth = async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"]?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      console.log(decoded, "decode");

      const adminId = decoded.id;
      const userType = decoded.userType;

      const findAdmin = await prisma.admin.findFirst({
        where: {
          id: adminId,
          userType: userType,
        },
      });

      if (findAdmin) {
        req.user = findAdmin;
      }
    } catch (error) {
      // You can choose to log it or ignore silently
      if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
        // Optional: You could log it for debug
        console.log("Optional token invalid/expired:", error.message);
      }
      // Do not block the request; continue to next middleware
    }
  }

  next();
};


const verifyMultiRoleToken = async (req, res, next) => {
  try {
    // Try user token
    await verifyUserToken(req, res, () => { });
    if (req.user) return next();

    // Try admin token
    await verifyAdminToken(req, res, () => { });
    if (req.user) return next();

    // Try barber token
    await verifyBarberToken(req, res, () => { });
    if (req.user) return next();

    return res.status(401).json({ message: "Unauthorized. Token invalid for all roles." });
  } catch (error) {
    next(error);
  }
};


module.exports = { verifyUserToken, verifyAdminToken, optionalAdminAuth, verifyBarberToken, verifyMultiRoleToken };

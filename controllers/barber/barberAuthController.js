const prisma = require("../../config/prismaConfig");
const { otpConstants, userConstants, deviceConstants } = require("../../constant/constant");
const { ConflictError, NotFoundError, ValidationError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const emailTemplates = require("../../utils/emailTemplete");
const { generateOtp } = require("../../utils/generateOtp");
const { genToken } = require("../../utils/generateToken");
const { hashPassword, comparePassword } = require("../../utils/passwordHashed");
const sendEmails = require("../../utils/sendEmail");
const { createConnectedAccount, verifyConnectedAccount } = require("../../utils/stripeApis");
const generateOtpExpiry = require("../../utils/verifyOtp");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const uploadFileWithFolder = require("../../utils/s3Upload");


const singUp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existbarber = await prisma.barber.findUnique({
      where: {
        email: email,
      }
    });

    if (existbarber) {
      throw new ConflictError("barber already exist")
    }

    const otp = generateOtp();
    const expiretime = generateOtpExpiry(2);

    await prisma.otp.create({
      data: {
        email,
        otp,
        otpReason: otpConstants.REGISTER,
        email,
        otpUsed: false,
        // userId: null,
        expiresAt: expiretime
      }
    })

    const emailData = {
      subject: "Cutsy - Account Verification",
      html: emailTemplates.register(otp),
    };

    await sendEmails(email, emailData.subject, emailData.html);


    handlerOk(res, 201, otp, "otp send successfully")

  } catch (error) {
    next(error)
  }
}

const verifyOtp = async (req, res, next) => {
  try {
    const { email,
      otp,
      password,
    } = req.body;


    const findotp = await prisma.otp.findFirst({
      where: {
        otp
      }
    });

    if (!findotp) {
      throw new NotFoundError("otp not found");
    }

    const now = new Date();

    if (findotp.expiresAt < now) {
      throw new ConflictError("otp expired")
    }

    if (findotp.otpReason === "REGISTER") {

      const hashedpassword = await hashPassword(password, 10);


      if (findotp.otpUsed) {
        throw new ConflictError("otp already used");
      }


      const savebarber = await prisma.barber.create({
        data: {
          email,
          password: hashedpassword,
          userType: userConstants.BARBER
        },

      });

      if (!savebarber) {
        throw new ValidationError("barber not save")
      }

      await prisma.otp.update({
        where: {
          id: findotp.id
        },
        data: {
          otpUsed: true,
          // barberId: savebarber.id
        }
      })

      const token = genToken({
        id: savebarber.id,
        userType: userConstants.BARBER,
      })

      handlerOk(res, 200, { ...savebarber, barberToken: token }, "barber register successfully")


    }
    if (findotp.otpReason === "FORGETPASSWORD") {
      const findbarber = await prisma.barber.findUnique({
        where: {
          email
        }
      });

      if (!findbarber) {
        throw new NotFoundError("barber not found")
      }

      if (findotp.otpUsed) {
        throw new ConflictError("otp already used")
      }

      await prisma.otp.update({
        where: {
          id: findotp.id
        },
        data: {
          otpUsed: true,
          // barberId: findbarber.id
        }
      });

      const token = genToken({
        id: findbarber.id,
        userType: userConstants.BARBER,
      });

      return handlerOk(res, 201, { barberToken: token }, "Now set your password");

    }
  } catch (error) {
    next(error)
  }
}

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find existing OTP record by email (not user)
    const existingOtp = await prisma.otp.findFirst({
      where: {
        email,
        otpUsed: false,
      },
    });

    if (!existingOtp) {
      throw new NotFoundError("OTP Record Not Found");
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.otp.update({
      where: { id: existingOtp.id },
      data: {
        otp,
        otpUsed: false,
        expiresAt,
      },
    });

    const emailData = {
      subject: "Cutsy - Account Verification",
      html: emailTemplates.resendOTP(otp),
    };

    await sendEmails(email, emailData.subject, emailData.html);

    handlerOk(res, 201, otp, "OTP sent successfully. Now verify your OTP.");
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const finduser = await prisma.barber.findUnique({
      where: {
        email
      },
      include: {
        selectedHairType: true,
        selectedHairLength: true,
        barberExperience: true,
        BarberAvailableHour: true,
        Review: true,
        BarberService: {
          include: {
            serviceCategory: true
          }
        }
      }
    });

    if (!finduser) {
      throw new NotFoundError("barber not found")
    }

    const comparePass = await comparePassword(password, finduser.password);

    if (!comparePass) {
      throw new BadRequestError("invalid password");
    }

    // Calculate the average rating and total number of reviews
    const totalReviews = finduser.Review.length;
    const averageRating = totalReviews > 0 ?
      finduser.Review.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;


    const token = genToken({
      id: finduser.id,
      userType: userConstants.BARBER,
    });

    const response = {
      barberToken: token,
      averageRating: averageRating,
      totalReviews: totalReviews
    }


    handlerOk(res, 200, { ...finduser, ...response }, "barber login successfully")

  } catch (error) {
    next(error)
  }
}

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const findbarber = await prisma.barber.findUnique({
      where: {
        email
      }
    });

    if (!findbarber) {
      throw new NotFoundError("barber not found")
    }

    const otp = generateOtp();
    const expiretime = generateOtpExpiry(2);

    const createotp = await prisma.otp.create({
      data: {
        email,
        // barberId: findbarber.id,
        otp,
        otpReason: otpConstants.FORGETPASSWORD,
        otpUsed: false,
        expiresAt: expiretime
      }
    })

    const emailData = {
      subject: "Cutsy - Reset Your Password",
      html: emailTemplates.forgetPassword(otp),
    };

    await sendEmails(email, emailData.subject, emailData.html);


    handlerOk(res, 200, otp, "otp send successfully");

  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    const { id } = req.user;


    const hashPass = await hashPassword(password);

    const updatePass = await prisma.barber.update({
      where: {
        id: id
      },
      data: {
        password: hashPass
      }
    });

    if (!updatePass) {
      throw new ValidationError("password not update");
    }

    handlerOk(res, 200, updatePass, "password updated successfully");

  } catch (error) {
    next(error)
  }
}

const editProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { name, address, gender, experience, bio } = req.body;
    const file = req.file;

    console.log(file, 'file');

    const updateObj = {};

    if (file) {
      // const filePath = file.filename; // use filename instead of path
      // const basePath = `http://${req.get("host")}/public/uploads/`;
      // const image = `${basePath}${filePath}`;
      // updateObj.image = image;

      const fileBuffer = file.buffer;
      const folder = 'uploads';
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const contentType = file.mimetype || 'application/octet-stream';

      const s3ImageUrl = await uploadFileWithFolder(fileBuffer, filename, contentType, folder);
      updateObj.image = s3ImageUrl;
    }

    if (name) {
      updateObj.name = name;
    }

    if (address) {
      updateObj.addressName = address;
    }

    if (experience) {
      updateObj.experience = experience;
    }

    if (gender) {
      updateObj.gender = gender;
    }

    if (bio) {
      updateObj.bio = bio;
    }

    const updateProfile = await prisma.barber.update({
      where: {
        id: id
      },
      data: updateObj
    });

    if (!updateProfile) {
      throw new ValidationError("barber profile not update")
    }

    handlerOk(res, 200, updateProfile, "barber profile updated successfully");

  } catch (error) {
    next(error)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const { currentpassword, newpassword } = req.body;
    const { id, password } = req.user;

    const comparePass = await comparePassword(currentpassword, password);

    if (!comparePass) {
      throw new BadRequestError("current password not correct")
    }

    const hashpass = await hashPassword(newpassword);

    const changePass = await prisma.barber.update({
      where: {
        id: id
      },
      data: {
        password: hashpass
      }
    });

    if (!changePass) {
      throw new ValidationError("password not change")
    }

    handlerOk(res, 200, changePass, "password changed successfully")

  } catch (error) {
    next(error)
  }
}

const logOut = async (req, res, next) => {
  try {
    const { id } = req.user;

    const logOutBarber = await prisma.barber.update({
      where: {
        id: id
      },
      data: {
        deviceToken: null
      }
    });

    if (!logOutBarber) {
      throw new ValidationError("barber logout failed")
    }

    handlerOk(res, 200, null, "barber logout successfully")

  } catch (error) {
    next(error)
  }
}

const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.user;

    const deletebarber = await prisma.barber.delete({
      where: {
        id: id
      }
    });

    if (!deletebarber) {
      throw new ValidationError("barber profile not delete")
    }

    handlerOk(res, 200, null, "barber profile deleted successfully")
  } catch (error) {
    next(error)
  }
}

const socailLogin = async (req, res, next) => {
  try {

    const { accessToken, socialType, deviceType, deviceToken } = req.body;


    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    // Check if barber exists
    let barber = await prisma.barber.findUnique({
      where: { email },
    });

    // If user doesn't exist, register them
    if (!barber) {
      barber = await prisma.barber.create({
        data: {
          email,
          name: name?.split(" ")[1] || null,
          accessToken: uid,
          socialType: socialType,
          image: picture || null,
          deviceType,
          deviceToken,
        },
      });
    } else {
      // Optional: Update device info on login
      await prisma.barber.update({
        where: { email },
        data: {
          deviceType,
          deviceToken,
        },
      });
    }

    // Generate your own app token (e.g., JWT)

    const token = genToken({
      id: barber.id,
      userType: userConstants.BARBER
    });

    handlerOk(res, 200, { barber, token }, "Login successful");


  } catch (error) {
    next(error);
  }
}

const barberCreateProfile = async (req, res, next) => {
  try {
    const { email } = req.user;
    const { name, phoneNumber, gender, experienceId, hairTypeId, hairLengthId, latitude, longitude, address, addressLine1, addressLine2, city, state, country, postalcode, deviceToken, deviceType } = req.body;

    const findhairtype = await prisma.hairType.findUnique({
      where: {
        id: hairTypeId,
      }
    });

    if (!findhairtype) {
      throw new NotFoundError("hair type not found")
    }

    const findhairlength = await prisma.hairLength.findUnique({
      where: {
        id: hairLengthId
      }
    });

    if (!findhairlength) {
      throw new NotFoundError("hair length not found")
    }


    const findexperience = await prisma.barberExperience.findUnique({
      where: {
        id: experienceId
      }
    });

    if (!findexperience) {
      throw new NotFoundError("experience not found")
    }

    const account = await createConnectedAccount(email);
    if (!account) {
      throw new ValidationError("connected account is null")
    }

    const verifyAccountUrl = await verifyConnectedAccount(account);

    if (!verifyAccountUrl) {
      throw new ValidationError("Account not verified")
    }

    // Update the barber's profile
    const savebarber = await prisma.barber.update({
      where: {
        email
      },
      data: {
        name,
        phoneNumber,
        gender,
        selectedHairType: { connect: { id: findhairtype.id } },  // Reference the related model directly
        selectedHairLength: { connect: { id: findhairlength.id } },  // Reference the related model directly
        barberExperience: { connect: { id: findexperience.id } }, // Reference the related model directly
        latitude,
        longitude,
        addressName: address,
        addressLine1,
        addressLine2,
        city,
        states: state,
        isCreatedProfile: true,
        country,
        postalCode: postalcode,
        userType: userConstants.BARBER,
        barberAccountId: account,
        deviceType,
        deviceToken
      },
      include: {
        selectedHairType: true,
        selectedHairLength: true,
        barberExperience: true,
        BarberService: true
      }
    });

    if (!savebarber) {
      throw new ValidationError("barber not save")
    }

    // Retrieve the OTP record by email first
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email
      }
    });

    if (!otpRecord) {
      throw new NotFoundError("OTP not found");
    }

    await prisma.otp.update({
      where: {
        id: otpRecord.id
      },
      data: {
        otpUsed: true,
      }
    });


    // Check if the BarberWallet already exists
    const existingWallet = await prisma.barberWallet.findUnique({
      where: {
        barberId: savebarber.id,
      }
    });

    // If no wallet exists, create a new one
    if (!existingWallet) {
      await prisma.barberWallet.create({
        data: {
          barberId: savebarber.id
        }
      });
    } else {
      console.log("Barber wallet already exists, skipping creation.");
    }

    const token = genToken({
      id: savebarber.id,
      userType: userConstants.BARBER,
    })

    handlerOk(res, 200, { ...savebarber, barberToken: token, verifyAccountUrl: verifyAccountUrl }, "barber profile  created successfully")
  } catch (error) {
    next(error)
  }
}

const getMe = async (req, res, next) => {
  try {
    const { id } = req.user;

    const barber = await prisma.barber.findUnique({
      where: {
        id: id
      },
      include: {
        selectedHairType: true,
        selectedHairLength: true,
        barberExperience: true,
        BarberAvailableHour: true,
        Review: true,
        BarberService: {
          include: {
            serviceCategory: true
          }
        }
      }
    });

    if (!barber) {
      throw new NotFoundError("barber not found")
    }

    // Calculate the average rating and total number of reviews
    const totalReviews = barber.Review.length;
    const averageRating = totalReviews > 0 ?
      barber.Review.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    const response = {
      averageRating: averageRating,
      totalReviews: totalReviews
    }

    handlerOk(res, 200, { ...barber, ...response }, "barber found successfully");

  } catch (error) {
    next(error)
  }
}

module.exports = {
  singUp,
  verifyOtp,
  login,
  forgetPassword,
  resetPassword,
  editProfile,
  changePassword,
  logOut,
  deleteAccount,
  socailLogin,
  barberCreateProfile,
  resendOtp,
  getMe
}
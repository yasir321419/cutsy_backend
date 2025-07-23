const prisma = require("../../config/prismaConfig");
const { otpConstants, userConstants } = require("../../constant/constant");
const { ConflictError, NotFoundError, ValidationError, BadRequestError } = require("../../handler/CustomError");
const emailTemplates = require("../../utils/emailTemplete");
const { generateOtp } = require("../../utils/generateOtp");
const generateOtpExpiry = require("../../utils/verifyOtp")
const sendEmails = require("../../utils/sendEmail");
const { handlerOk } = require("../../handler/resHandler");
const { comparePassword, hashPassword } = require("../../utils/passwordHashed");
const { genToken } = require("../../utils/generateToken");
const admin = require('firebase-admin');
const { createCustomer } = require("../../utils/stripeApis");

const signUp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
      }
    });

    if (existingUser) {
      throw new ConflictError("user already exist")
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
    const { email, otp, password,
      // latitude, longitude, address, addressLine1, addressLine2, city, state, country, postalcode
    } = req.body;

    const findotp = await prisma.otp.findFirst({
      where: {
        otp,
      }
    });

    if (!findotp) {
      throw new NotFoundError("otp not found")
    }

    const now = new Date();

    if (findotp.expiresAt < now) {
      throw new ConflictError("otp expired")
    }

    if (findotp.otpReason === "REGISTER") {

      const hashedpassword = await hashPassword(password, 10);

      if (findotp.otpUsed) {
        throw new ConflictError("OTP already used");
      }

      // const findhairtype = await prisma.hairType.findUnique({
      //   where: {
      //     id: hairTypeId,
      //   }
      // });

      // if (!findhairtype) {
      //   throw new NotFoundError("hair type not found")
      // }

      // const findhairlength = await prisma.hairLength.findUnique({
      //   where: {
      //     id: hairLengthId
      //   }
      // });

      // if (!findhairlength) {
      //   throw new NotFoundError("hair length not found")
      // }

      // const customer = await createCustomer(email);

      // if (!customer) {
      //   throw new ValidationError("customer id is null")
      // }

      const saveuser = await prisma.user.create({
        data: {
          email,
          // addressLine1,
          // addressLine2,
          // addressName: address,
          // city,
          // country,
          // firstName,
          // lastName,
          // gender,
          // latitude,
          // longitude,
          password: hashedpassword,
          // phoneNumber,
          // postalCode: postalcode,
          // selectedHairLengthId: findhairlength.id,
          // selectedHairTypeId: findhairtype.id,
          // states: state,
          // customerId: customer.id,
          // deviceToken,
          // deviceType,
          userType: userConstants.USER
        },
        // include: {
        //   selectedHairType: true,
        //   selectedHairLength: true
        // }
      });

      if (!saveuser) {
        throw new ValidationError("user not save");
      }

      // const saveaddress = await prisma.userAddress.create({
      //   data: {
      //     latitude,
      //     longitude,
      //     addressName: address,
      //     addressLine1,
      //     addressLine2,
      //     city,
      //     states: state,
      //     country,
      //     postalCode: postalcode,
      //     createdById: saveuser.id
      //   }
      // });

      // if (!saveaddress) {
      //   throw new ValidationError("user address not save");
      // }

      await prisma.otp.update({
        where: {
          id: findotp.id
        },
        data: {
          otpUsed: true,
        }
      })

      const token = genToken({
        id: saveuser.id,
        userType: userConstants.USER,
      })

      handlerOk(res, 200, { ...saveuser, userToken: token }, "user register successfully")
    }
    if (findotp.otpReason === "FORGETPASSWORD") {
      const finduser = await prisma.user.findUnique({
        where: {
          email
        }
      });

      if (!finduser) {
        throw new NotFoundError("user not found");
      }

      if (findotp.otpUsed) {
        throw new ConflictError("otp already used");
      }

      await prisma.otp.update({
        where: {
          id: findotp.id
        },
        data: {
          otpUsed: true,
          // userId: finduser.id
        }
      });


      // ✅ Generate token
      const token = genToken({
        id: finduser.id,
        userType: userConstants.USER,
      });

      return handlerOk(res, 201, { userToken: token }, "Now set your password");
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

    const finduser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!finduser) {
      throw new NotFoundError("user not found");
    }

    const comparePass = await comparePassword(password, finduser.password);

    if (!comparePass) {
      throw new BadRequestError("invalid password");
    }

    const token = genToken({
      id: finduser.id,
      userType: userConstants.USER,
    });

    const response = {
      userToken: token,
    }


    handlerOk(res, 200, { ...finduser, ...response }, "user login successfully")

  } catch (error) {
    next(error)
  }
}

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const finduser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!finduser) {
      throw new NotFoundError("user not found");
    }

    const otp = generateOtp();
    const expiretime = generateOtpExpiry(2);

    const createotp = await prisma.otp.create({
      data: {
        email,
        // userId: finduser.id,
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

    console.log(id, 'id');

    const hashPass = await hashPassword(password);

    const updatePass = await prisma.user.update({
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
    const { firstName, lastName, phoneNumber, gender } = req.body;
    const file = req.file;

    console.log(file, 'file');

    const updateObj = {};

    if (file) {
      const filePath = file.filename; // use filename instead of path
      const basePath = `http://${req.get("host")}/public/uploads/`;
      const image = `${basePath}${filePath}`;
      updateObj.image = image;
    }

    if (firstName) {
      updateObj.firstName = firstName;
    }

    if (lastName) {
      updateObj.lastName = lastName;
    }

    if (phoneNumber) {
      updateObj.phoneNumber = phoneNumber;
    }

    if (gender) {
      updateObj.gender = gender;
    }

    const updateProfile = await prisma.user.update({
      where: {
        id: id
      },
      data: updateObj
    });

    if (!updateProfile) {
      throw new ValidationError("user profile not update")
    }

    handlerOk(res, 200, updateProfile, "user profile updated successfully");

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

    const changePass = await prisma.user.update({
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

    const logOutUser = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        deviceToken: null
      }
    });

    if (!logOutUser) {
      throw new ValidationError("user not logout")
    }

    handlerOk(res, 200, null, "user logout successfully");

  } catch (error) {
    next(error)
  }
}

const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.user;

    const deleteAccount = await prisma.user.delete({
      where: {
        id: id
      }
    });

    if (!deleteAccount) {
      throw new ValidationError("user account not deleted")
    }

    handlerOk(res, 200, null, "user account deleted successfully")

  } catch (error) {
    next(error)
  }
}

const socialLogin = async (req, res, next) => {
  try {

    const { accessToken, socialType, deviceType, deviceToken } = req.body;


    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, register them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName: name?.split(" ")[0] || null,
          lastName: name?.split(" ")[1] || null,
          accessToken: uid,
          socialType: socialType,
          image: picture || null,
          deviceType,
          deviceToken,
        },
      });
    } else {
      // Optional: Update device info on login
      await prisma.user.update({
        where: { email },
        data: {
          deviceType,
          deviceToken,
        },
      });
    }

    // Generate your own app token (e.g., JWT)

    const token = genToken({
      id: user.id,
      userType: userConstants.USER
    });

    handlerOk(res, 200, { user, token }, "Login successful");


  } catch (error) {
    next(error);
  }
}

const userCreateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, gender, hairTypeId, hairLengthId, latitude, longitude, address, addressLine1, addressLine2, city, state, country, postalcode, deviceToken, deviceType } = req.body;
    const { email } = req.user;

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

    const customer = await createCustomer(email);

    if (!customer) {
      throw new ValidationError("customer id is null")
    }

    const saveuser = await prisma.user.update({

      where: {
        email
      },
      data: {
        addressLine1,
        addressLine2,
        addressName: address,
        city,
        country,
        firstName,
        lastName,
        gender,
        latitude,
        longitude,
        phoneNumber,
        postalCode: postalcode,
        isCreatedProfile: true,
        selectedHairLengthId: findhairlength.id,
        selectedHairTypeId: findhairtype.id,
        states: state,
        customerId: customer.id,
        deviceToken,
        deviceType,
        userType: userConstants.USER
      },
      include: {
        selectedHairType: true,
        selectedHairLength: true
      }
    });

    if (!saveuser) {
      throw new ValidationError("user not save");
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
        createdById: saveuser.id
      }
    });

    if (!saveaddress) {
      throw new ValidationError("user address not save");
    }

    await prisma.otp.update({
      where: {
        email
      },
      data: {
        otpUsed: true,
      }
    })

    const token = genToken({
      id: saveuser.id,
      userType: userConstants.USER,
    })

    handlerOk(res, 200, { ...saveuser, userToken: token }, "user profile created successfully")
  } catch (error) {
    next(error)
  }
}


module.exports = {
  signUp,
  verifyOtp,
  login,
  forgetPassword,
  resetPassword,
  editProfile,
  logOut,
  changePassword,
  deleteAccount,
  socialLogin,
  resendOtp,
  userCreateProfile
}


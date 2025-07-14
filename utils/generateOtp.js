const prisma = require("../config/prismaConfig")

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const resetOtp = async (table, id) => {
  setTimeout(async () => {
    await prisma[table].update({
      data: {
        otp: ""
      },
      where: {
        id
      }
    })
  }, 60000);
}

module.exports = { generateOtp, resetOtp };

const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberBusinessAccountRouter = require("express").Router();
const barberBusinessAccountController = require("../../controllers/barber/barberAccountController");
const { verifyBarberToken } = require("../../middleware/auth");
const { addBarberbusinessAccountSchema, verifyBarberbusinessAccountSchema, withDrawAmountBarberSchema } = require("../../schema/barber/account");




barberBusinessAccountRouter.post(
  "/addbarberBusinessAccount",
  limiter,
  verifyBarberToken,
  validateRequest(addBarberbusinessAccountSchema),
  barberBusinessAccountController.addbarberBusinessAccount
);

barberBusinessAccountRouter.get(
  "/showbarberBusinessAccount",
  limiter,
  verifyBarberToken,
  barberBusinessAccountController.showbarberBusinessAccount
);

barberBusinessAccountRouter.get(
  "/verificationBarberBusinessAccount/:accountId",
  limiter,
  verifyBarberToken,
  validateRequest(verifyBarberbusinessAccountSchema),
  barberBusinessAccountController.verificationBarberBusinessAccount
);

barberBusinessAccountRouter.get(
  "/checkBarberBalance",
  limiter,
  verifyBarberToken,
  barberBusinessAccountController.checkBarberBalance
);

barberBusinessAccountRouter.post(
  "/withDrawAmountBarber",
  limiter,
  verifyBarberToken,
  validateRequest(withDrawAmountBarberSchema),
  barberBusinessAccountController.withDrawAmountBarber
);

barberBusinessAccountRouter.get(
  "/showAllBarberTransactions",
  limiter,
  verifyBarberToken,
  barberBusinessAccountController.showAllBarberTransactions
);

module.exports = barberBusinessAccountRouter;
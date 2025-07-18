const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberBusinessAccountRouter = require("express").Router();
const barberBusinessAccountController = require("../../controllers/barber/barberAccountController");
const { verifyBarberToken } = require("../../middleware/auth");
const { addBarberbusinessAccountSchema, verifyBarberbusinessAccountSchema } = require("../../schema/barber/account");




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

module.exports = barberBusinessAccountRouter;
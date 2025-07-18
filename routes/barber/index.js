const barberRouter = require("express").Router();
const barberAuthRouter = require("./barberAuth");
const barberServiceRouter = require("./barberService");
const barberAvailableHourRouter = require("./barberAvailableHourSubmitDocument");
const barberBusinessAccountRouter = require("./barberBusinessAccount");

barberRouter.use("/auth", barberAuthRouter);
barberRouter.use("/service", barberServiceRouter);
barberRouter.use("/availablehourandsubmitdocument", barberAvailableHourRouter);
barberRouter.use("/businessaccount", barberBusinessAccountRouter);




module.exports = barberRouter;
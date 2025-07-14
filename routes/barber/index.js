const barberRouter = require("express").Router();
const barberAuthRouter = require("./barberAuth");
const barberServiceRouter = require("./barberService");
const barberAvailableHourRouter = require("./barberAvailableHourSubmitDocument");


barberRouter.use("/auth", barberAuthRouter);
barberRouter.use("/service", barberServiceRouter);
barberRouter.use("/availablehourandsubmitdocument", barberAvailableHourRouter);



module.exports = barberRouter;
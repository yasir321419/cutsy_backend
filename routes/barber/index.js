const barberRouter = require("express").Router();
const barberAuthRouter = require("./barberAuth");
const barberServiceRouter = require("./barberService");
const barberAvailableHourRouter = require("./barberAvailableHourSubmitDocument");
const barberBusinessAccountRouter = require("./barberBusinessAccount");
const barberAppoinmentHistoryRouter = require("./barberAppoinmentHistory");
const barberDashboardRouter = require("./barberDashboard");
const barberNotificationRouter = require("./barberNotification");

barberRouter.use("/auth", barberAuthRouter);
barberRouter.use("/service", barberServiceRouter);
barberRouter.use("/availablehourandsubmitdocument", barberAvailableHourRouter);
barberRouter.use("/businessaccount", barberBusinessAccountRouter);
barberRouter.use("/appoinmenthistory", barberAppoinmentHistoryRouter);
barberRouter.use("/dashboard", barberDashboardRouter);
barberRouter.use("/notification", barberNotificationRouter);







module.exports = barberRouter;
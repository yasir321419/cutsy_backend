const adminRouter = require("express").Router();
const adminAuthRouter = require("./adminAuth");
const adminHairRouter = require("./adminHairTypeLength");
const adminExperienceRouter = require("./adminExperience");
const adminBarberServiceRouter = require("./adminBarberService");
const adminContentRouter = require("./adminContent");
const adminHandlerAccountRouter = require("./adminHandleAccount");

adminRouter.use("/auth", adminAuthRouter);
adminRouter.use("/hair", adminHairRouter);
adminRouter.use("/barberexperience", adminExperienceRouter);
adminRouter.use("/barberservice", adminBarberServiceRouter);
adminRouter.use("/content", adminContentRouter);
adminRouter.use("/payment", adminHandlerAccountRouter);







module.exports = adminRouter;
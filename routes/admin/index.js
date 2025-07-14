const adminRouter = require("express").Router();
const adminAuthRouter = require("./adminauth");
const adminHairRouter = require("./adminHairTypeLength");
const adminExperienceRouter = require("./adminExperience");
const adminBarberServiceRouter = require("./adminBarberService");
const adminContentRouter = require("./adminContent");

adminRouter.use("/auth", adminAuthRouter);
adminRouter.use("/hair", adminHairRouter);
adminRouter.use("/barberexperience", adminExperienceRouter);
adminRouter.use("/barberservice", adminBarberServiceRouter);
adminRouter.use("/content", adminContentRouter);






module.exports = adminRouter;
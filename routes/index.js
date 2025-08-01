const express = require("express");
const router = express.Router();

const userRouter = require("./user/index");
const adminRouter = require("./admin/index");
const barberRouter = require("./barber/index");


router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/barber", barberRouter);




router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


module.exports = router;


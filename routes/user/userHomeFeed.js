const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userHomeFeedRouter = require("express").Router();
const userHomeFeedController = require("../../controllers/user/userHomeFeedController");
const { verifyUserToken } = require("../../middleware/auth");
const { userSearchBarberSchema, userSaveBarberInFavoriteSchema } = require("../../schema/user/homefeed");



userHomeFeedRouter.get(
  "/showNearestBarbers",
  limiter,
  verifyUserToken,
  userHomeFeedController.showNearestBarbers
);

userHomeFeedRouter.get(
  "/showTrendingBarbers",
  limiter,
  verifyUserToken,
  userHomeFeedController.showTrendingBarbers
);

userHomeFeedRouter.get(
  "/showBarbersBySearchService",
  limiter,
  verifyUserToken,
  validateRequest(userSearchBarberSchema),
  userHomeFeedController.showBarbersBySearchService
);

userHomeFeedRouter.post(
  "/saveBarberInFavoriteList/:barberId",
  limiter,
  verifyUserToken,
  validateRequest(userSaveBarberInFavoriteSchema),
  userHomeFeedController.saveBarberInFavoriteList
);

userHomeFeedRouter.get(
  "/showBarberFavouriteList",
  limiter,
  verifyUserToken,
  userHomeFeedController.showBarberFavouriteList
);

module.exports = userHomeFeedRouter;
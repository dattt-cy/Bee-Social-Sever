const express = require("express");

const authController = require("./../controllers/authController");
const feedController = require("./../controllers/feedController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(feedController.setQuery, feedController.getFeedByUser)
  .post(feedController.setFeedSeen);
router.route("/ads").get(feedController.getRandomAds);
router.route("/follow").get(feedController.getFollowingUserFeed);
router.route("/unfollow").get(feedController.getRemovedFeed);
router.route("/suggest").get(feedController.getSuggestedFeed);
module.exports = router;

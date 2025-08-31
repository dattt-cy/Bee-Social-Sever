const express = require("express");

const authController = require("./../controllers/authController");
const advController = require("./../controllers/advertisementPlanController");

const router = express.Router();

router
  .route("/")
  .get(advController.getAllAdvertisementPlans)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    advController.createAdvertisementPlan
  );

router.route("/:id").get(advController.getAdvertisementPlan);

module.exports = router;

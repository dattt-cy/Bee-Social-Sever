const express = require("express");
const authController = require("./../controllers/authController");
const priceController = require("./../controllers/unitPriceController");

const router = express.Router();

router
  .route("/")
  .get(priceController.getAll)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    priceController.createUnitPrice
  );

router
  .route("/:id")
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    priceController.updateUnitPrice
  );

module.exports = router;

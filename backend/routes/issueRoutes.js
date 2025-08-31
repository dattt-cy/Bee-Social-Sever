const express = require("express");
const issueController = require("./../controllers/issueController");
const authController = require("./../controllers/authController");
const router = express.Router();

router
  .route("/")
  .get(issueController.getAllIssues)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    issueController.createIssue
  );

module.exports = router;

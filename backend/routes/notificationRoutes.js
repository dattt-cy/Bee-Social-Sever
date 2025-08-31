const express = require("express");
const notiController = require("./../controllers/notificationController");
const authController = require("./../controllers/authController");
const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(notiController.getNotificationsByUser)
  .post(notiController.createNotifications)
  .patch(notiController.setNotificationRead);

router.route("/all").patch(notiController.setAllNotificationsRead);
module.exports = router;

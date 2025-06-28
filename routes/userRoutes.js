const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");
const router = express.Router();

router.post("/signup", authController.signup1);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
// router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.get("/me", userController.getMe);
router.get("/checkId/:id", userController.checkMyId);
router.get("/getProfileByID/:id", userController.getProfileByID);
router.patch("/updateMe", userController.updateMe);


router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)

module.exports = router;

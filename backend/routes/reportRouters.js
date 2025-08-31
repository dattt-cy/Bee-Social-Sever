const express = require('express');
const reportController = require('./../controllers/reportController');
const authController = require('./../controllers/authController');


const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);
// user
router.post('/createReport',authController.restrictTo('user'),reportController.createReport);
// admin
router.get('/getAllReports', authController.restrictTo('admin'), reportController.getAllReports);
router.post('/reportProcessing',authController.restrictTo('admin'),reportController.reportProcessing);





module.exports = router;
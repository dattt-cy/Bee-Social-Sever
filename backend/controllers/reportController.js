const catchAsync = require('./../utils/catchAsync');
const reportService = require('../services/reportServices');
const Report = require('../models/reportModel');
const factory = require('./handlerFactory');

exports.createReport = catchAsync(async (req, res) => {
    const data = await reportService.createReport(req.body, req.user.id);
    return res.status(200).json(
        data
    );
});

// exports.getAllReports = catchAsync(async (req, res) => {
//     const data = await reportService.getAllReports();
//     return res.status(200).json(
//         data
//     );
// });
exports.getAllReports = factory.getAll(Report);


exports.reportProcessing = catchAsync(async (req, res) => {
    const data = await reportService.reportProcessing(req.body,req.user.id);
    return res.status(200).json(
        data
    );
});

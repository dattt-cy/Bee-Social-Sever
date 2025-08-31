const ReportModel = require("./../models/reportModel");
const PostModel = require("./../models/postModel");
const AppError = require("./../utils/appError");
const postServices = require("./postServices");
exports.createReport = (data, reporter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { post, reason } = data;

      if (!reason || !reporter) {
        reject(new AppError(`Miss parameter`, 400));
      } else {
        await ReportModel.create({
          reporter: reporter,
          post: post,
          reason: reason,
        });
        resolve({
          status: "Success",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

exports.getAllReports = () => {
  return new Promise(async (resolve, reject) => {
    try {
        const reports = await ReportModel.find().populate({
        path: "reporter",
        select: "profile",
        populate: {
          path: "profile",
          model: "Profile",
          select: "firstname lastname",
        },
      });
        resolve({
          status: "Success",
          data: reports
        });
    } catch (error) {
      reject(error);
    }
  });
};

exports.reportProcessing = (data,userId) => {
  return new Promise(async (resolve, reject) => {
    try {
        if (!data.status || !data.reportId) {
        reject(new AppError(`You have not selected a status`, 400));
        } else {
          let report = await ReportModel.findOneAndUpdate({ _id: data.reportId }, {
              status: data.status,
              processingDate: Date.now()
            })
          if (data.status === 'Accepted') {
            await postServices.deletePost(report.post,userId)
          }

        resolve({
          status: "Success",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};



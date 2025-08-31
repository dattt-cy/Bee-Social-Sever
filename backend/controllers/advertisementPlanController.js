const catchAsync = require("./../utils/catchAsync");
const advertisementPlanServices = require("./../services/advertisementPlanServices");

exports.createAdvertisementPlan = catchAsync(async (req, res, next) => {
  const data = await advertisementPlanServices.createAdvertisememtPlan(
    req.body
  );

  res.status(201).json(data);
});

exports.getAdvertisementPlan = catchAsync(async (req, res, next) => {
  const data = await advertisementPlanServices.getAdvertisementPlan(
    req.params.id
  );

  res.status(200).json(data);
});

exports.getAllAdvertisementPlans = catchAsync(async (req, res, next) => {
  const data = await advertisementPlanServices.getAllAdvertisementPlans();
  res.status(200).json(data);
});

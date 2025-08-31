const AdvertisementPlan = require("./../models/advertisementPlanModel");
const AppError = require("./../utils/appError");

exports.createAdvertisememtPlan = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { name, price, duration, type } = data;
      if (!name || !duration) {
        reject(new AppError("Please fill in all required fields", 400));
      }

      const plan = await AdvertisementPlan.create({
        name: name,
        price: price,
        type: type,
        duration: duration,
      });

      if (!plan) {
        reject(new AppError("An error occurs", 400));
      }

      resolve({
        status: "success",
        data: plan,
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getAdvertisementPlan = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Empty id`, 400));
      }

      const plan = await AdvertisementPlan.findById(id);

      if (!plan) {
        reject(new AppError(`Advertisement plan not found`, 404));
      }

      resolve({
        status: "success",
        data: plan,
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.deleteAdvertisementPlan = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Empty id`, 400));
      }

      const plan = await AdvertisementPlan.findByIdAndDelete(id);
      resolve({
        status: "success",
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getAllAdvertisementPlans = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const plans = await AdvertisementPlan.find();

      resolve({
        status: "success",
        data: plans,
        results: plans.length,
      });
    } catch (err) {
      reject(err);
    }
  });
};

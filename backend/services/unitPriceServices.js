const UnitPrice = require("./../models/unitPriceModel");
const AppError = require("./../utils/appError");

exports.createUnitPrice = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { price, type } = data;
      if (!price) {
        reject(new AppError(`Please fill all required fields`, 400));
      }

      const unitPrice = await UnitPrice.create({
        price: price,
        type: type,
      });

      resolve({
        status: "success",
        data: unitPrice,
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getAll = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await UnitPrice.find();
      resolve({
        status: "success",
        results: result.length,
        data: result,
      });
    } catch (err) {
      reject(err);
    }
  });
};
exports.updateUnitPrice = (id, newPrice) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id || !newPrice) {
        reject(new AppError(`Please fill all required fields`, 400));
      }

      const price = await UnitPrice.findById(id);
      if (!price) {
        reject(new AppError(`Unit price not found`, 404));
      }

      const result = await UnitPrice.findByIdAndUpdate(
        id,
        {
          price: newPrice,
          updatedAt: Date.now(),
        },
        { new: true }
      );

      resolve({
        status: "success",
        data: result,
      });
    } catch (err) {
      reject(err);
    }
  });
};

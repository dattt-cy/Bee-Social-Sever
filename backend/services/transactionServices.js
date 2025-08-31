const PostTransaction = require("./../models/postTransactionModel");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

exports.createTransaction = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { amount, post } = data;
      if (!amount || !post) {
        reject(new AppError(`Please fill all required fields`, 400));
      }

      const transaction = await PostTransaction.create({
        amount: amount,
        post: post,
      });

      resolve({
        status: "success",
        data: transaction,
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getTransactionById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Empty Id`, 400));
      }

      const transaction = await PostTransaction.findById(id);
      if (!transaction) {
        reject(new AppError(`Transaction not found`, 404));
      }
      resolve({
        status: "success",
        data: transaction,
      });
    } catch (err) {
      reject(err);
    }
  });
};
exports.changeTransactionStatus = (id, status) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Empty Id`, 400));
      }

      const transaction = await PostTransaction.findByIdAndUpdate(
        id,
        {
          status: status,
        },
        { new: true }
      );
      if (!transaction) {
        reject(new AppError(`Transaction not found`, 404));
      }

      resolve({
        status: "success",
        data: transaction,
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getTransactionByBusiness = (id, query) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Empty business account id`, 400));
      }
      const features = new APIFeatures(
        PostTransaction.find({}).populate({
          path: "post",
          populate: {
            path: "user",
            model: "User",
            match: { id: id },
          },
        }),
        query
      )
        .sort()
        .paginate();

      let transactions = await features.query;
      transactions = transactions.filter(
        (transaction) => transaction.post && transaction.post.user.id === id
      );
      resolve({
        status: "success",
        results: transactions.length,
        data: transactions,
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getRevenue = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const revenue = await PostTransaction.aggregate([
        {
          $match: {
            status: "success",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      return resolve(revenue[0].totalAmount ?? 0);
    } catch (error) {
      return reject(err);
    }
  });
};

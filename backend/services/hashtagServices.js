const AppError = require("../utils/appError");
const Hashtag = require("./../models/hashtagModel");

exports.createHashtags = (content) => {
  return new Promise(async (resolve, reject) => {
    try {
      //filter post hashtags
      const hashtags = content.match(/#(\w+)/g);
      //create posthashtag
      // await hashtags.forEach(async (element) => {
      //   const hashtag = await Hashtag.findOne({ name: element });
      //   if (!hashtag) {
      //     await Hashtag.create({ name: element });
      //   }
      // });
      resolve({
        status: "success",
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.searchHashtag = (searchText) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!content) {
        reject(new AppError(`Search Text is required`, 400));
      }
      const hashtags = await Hashtag.find({
        name: { $regex: searchText, $options: "i" },
      });
      resolve({
        stauts: "success",
        data: hashtags,
      });
    } catch (err) {
      reject(err);
    }
  });
};

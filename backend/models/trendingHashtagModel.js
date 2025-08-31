const mongoose = require("mongoose");

const TrendingHashtagSchema = new mongoose.Schema(
  {
    hashtag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hashtag", // Reference to the Hashtag model
      required: [true, "A trend must have a hashtag"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Reference to the Hashtag model
      default: null,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
TrendingHashtagSchema.pre("find", function (next) {
  this.populate({
    path: "category",
    select: "-__v -createdAt",
  }).populate({
    path: "hashtag",
    select: "-__v",
  });
  this.select("-__v");
  next();
});
const TrendingHashtagModel = mongoose.model(
  "TrendingHashtag",
  TrendingHashtagSchema
);
module.exports = TrendingHashtagModel;

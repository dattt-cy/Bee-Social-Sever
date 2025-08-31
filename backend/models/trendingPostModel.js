const mongoose = require("mongoose");

const TrendingPostSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "A trending post must have its category"],
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

const TrendingPostModel = mongoose.model("TrendingPost", TrendingPostSchema);
module.exports = TrendingPostModel;

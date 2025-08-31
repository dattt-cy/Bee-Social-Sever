const mongoose = require("mongoose");


const CategoryPostSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Reference to the Category model
    required: [true, "A category post must have a category"],
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post", // Reference to the Post model
    required: [true, "A category post must have a post"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CategoryPostModel = mongoose.model("CategoryPost", CategoryPostSchema);

module.exports = CategoryPostModel;

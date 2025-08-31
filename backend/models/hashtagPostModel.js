const mongoose = require("mongoose");
const HashtagPostschema = new mongoose.Schema(
  {
    hashtag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hashtag", // Reference to the Hashtag model
      required: [true, "A hashtag post must have a hashtag"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // Reference to the Post model
      required: [true, "A hashtag post must have a post"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// HashtagPostschema.virtual("categories").get(async function () {
//   const post = await Post.findOne({ _id: this.post });
//   return post.categories;
// });

HashtagPostschema.index({ hashtag: -1 });
HashtagPostschema.index({ createdAt: -1 });
const HashtagPostModel = mongoose.model("HashtagPost", HashtagPostschema);

module.exports = HashtagPostModel;

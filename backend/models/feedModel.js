const mongoose = require("mongoose");

const FeedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A feed must belong to a user"],
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "A feed must contain post"],
    },
    seen: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["following", "suggested", "advertisement"],
      default: "following",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    dateToBeSeen: {
      type: Date,
      default: Date.now,
    },
    // isLiked: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

FeedSchema.index({ user: 1 });

const FeedModel = mongoose.model("Feed", FeedSchema);

module.exports = FeedModel;

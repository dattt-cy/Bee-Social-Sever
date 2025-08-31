const mongoose = require("mongoose");

const BusinessPost = require("./../models/businessPostModel");

const PostTransactionSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessPost",
    },
    status: {
      type: String,
      enum: ["pending", "failed", "success"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: [true, "A transaction must have amount"],
      validate: {
        validator: function (value) {
          return value >= 0;
        },
        message: () => `A price must be greater or equal to 0`,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PostTransactionSchema.post("findOneAndUpdate", async function (doc, next) {
  // const updatedFields = this.getUpdate();
  if (doc) {
    let status = "pending";
    status = doc.status === "success" ? "approved" : "deferred";
    const postId = doc.post;
    const post = await BusinessPost.findOneAndUpdate(
      { _id: postId },
      {
        status: status,
      },
      { new: true }
    );
  }

  next();
});

const PostTransactionModel = mongoose.model(
  "PostTransaction",
  PostTransactionSchema
);

module.exports = PostTransactionModel;

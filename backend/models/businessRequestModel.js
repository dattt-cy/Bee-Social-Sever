const mongoose = require("mongoose");

const BusinessRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "A business request must belong to a user"],
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "verified", "approved", "canceled", "rejected"],
    default: "pending",
  },
});

BusinessRequestSchema.index({ user: 1 }, { unique: true });

BusinessRequestSchema.pre(/^find/, function (next) {
  this.populate("user");
  next();
});

const BusinessRequestModel = mongoose.model(
  "BusinessRequest",
  BusinessRequestSchema
);

module.exports = BusinessRequestModel;

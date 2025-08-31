const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", // Reference to the Post model
        required: [true, "A like must have a post"],
    },
    reason: {
        type: String,
        required: [true, "Please tell us your reason!"],
        },
    status: {
        type: String,
        enum: ["Processing", "Accepted", "Rejected"],
        default: "Processing",
        },
    processingDate: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
ReportSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } }).select("-verifyToken -refreshToken");
    this.populate("reporter");
  next();
});

const ReportModel = mongoose.model("Report", ReportSchema);

module.exports = ReportModel;

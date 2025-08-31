const mongoose = require("mongoose");
const Comment = require("./../models/commentModel");

const CommentLikeSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment", // Reference to the Comment model
        required: [true, "A comment like must have a comment"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: [true, "A comment like must have a user"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
CommentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

// set numlikes when commentlike model change
CommentLikeSchema.statics.setNumLikes = async function (commentId) {
    let numLikes = 0;
    if (commentId) {
        numLikes = await this.countDocuments({ comment: commentId });
    }
    await Comment.findByIdAndUpdate(commentId, { numLikes: numLikes });
};

//1 set numlikes for comment after like comment
CommentLikeSchema.post("save", async function (doc, next) {
    if (doc) {
        await this.constructor.setNumLikes(doc.comment);
    }
    next();
});

//2 set numlikes for comment after unlike comment
CommentLikeSchema.pre(/^findOneAndDelete/, async function (next) {
    this.deletedCommentLike = await this.model.findOne(this.getFilter());
    next();
});
CommentLikeSchema.post(/^findOneAndDelete/, async function (doc, next) {
    if (doc) {
        await this.deletedCommentLike.constructor.setNumLikes(
            this.deletedCommentLike.comment
        );
    }
    next();
});
const CommentLikeModel = mongoose.model("CommentLike", CommentLikeSchema);

module.exports = CommentLikeModel;

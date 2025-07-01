const mongoose = require("mongoose");

const Post = require("./postModel");

const LikePostschema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: [true, "A like must have a user"],
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", // Reference to the Post model
        required: [true, "A like must have a post"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

LikePostschema.index({ user: 1, post: 1 }, { unique: true });

//set numLike for a post wwhen likePost model changes
LikePostschema.statics.setNumLikes = async function (postId) {
    let numLikes = 0;
    if (postId) {
        numLikes = await this.countDocuments({ post: postId });
    }
    await Post.findByIdAndUpdate(postId, { numLikes: numLikes });
};

// set numLikes when create a likePost model
LikePostschema.post("save", async function (doc, next) {
    if (doc) {
        await this.constructor.setNumLikes(doc.post);
    }
    next();
});

//2 set numlikes for comment after unlike comment
//2.1 Get comment which stores postId to pass to the next middle ware
LikePostschema.pre(/^findOneAndDelete/, async function (next) {
    this.deletedLikePost = await this.model.findOne(this.getFilter());
    next();
});
//2.2 Retrieve postId then set numlikes
LikePostschema.post(/^findOneAndDelete/, async function (doc, next) {
    if (doc) {
        await this.deletedLikePost.constructor.setNumLikes(
            this.deletedLikePost.post
        );
    }
    next();
});

const LikePostModel = mongoose.model("LikePost", LikePostschema);
module.exports = LikePostModel;

const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
    {
        title: String,
        content: {
            type: String,
            maxLength: 4096 * 2,
            trim: true,
        },
        images: {
            type: [String],
            validate: {
                validator: (array) => array.length <= 4,
                message: "A post can have only up to 4 images",
            },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "A post must belong to a user"],
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post", // Reference to parent post for sharing
            default: null,
        },
        numLikes: {
            type: Number,
            default: 0,
        },
        numComments: {
            type: Number,
            default: 0,
        },
        numShares: {
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        isActived: {
            type: Boolean,
            default: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

PostSchema.statics.setNumShares = async function (postId) {
    let numShares = 0;
    if (postId) {
        numShares = await this.countDocuments({ parent: postId });
    }
    console.log(numShares);
    await this.findByIdAndUpdate(postId, { numShares: numShares });
};

PostSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "_id email profile role",
        populate: {
            path: "profile",
            model: "Profile",
            select: "avatar firstname lastname -user slug",
        },
    }).populate({
        path: "parent",
        select: "content images user createdAt", // Thêm các field cần thiết
        populate: {
            path: "user",
            select: "_id email profile role",
            populate: {
                path: "profile",
                model: "Profile",
                select: "avatar firstname lastname -user slug",
            },
        },
    });
    next();
});

const PostModel = mongoose.model("Post", PostSchema);

module.exports = PostModel;

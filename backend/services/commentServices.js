const AppError = require("../utils/appError");
const Post = require("./../models/postModel");
const Comment = require("./../models/commentModel");
const CommentLike = require("./../models/commentLikeModel");
const APIFeatures = require("./../utils/apiFeatures");

const notiServices = require("./notificationServices");

const checkPost = async (postId) => {
    const post = await Post.findById(postId);
    if (!post) {
        throw new AppError(`Post not found`, 404);
    }
    if (!post.isActived) {
        throw new AppError(`This post no longer existed`, 404);
    }
    return post;
};

exports.checkParentComment = (commentId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!commentId) {
                return resolve({
                    status: "success",
                    data: true,
                });
            }
            const comment = await Comment.findById(commentId);
            if (!comment) {
                return reject(new AppError(`Comment not found`, 404));
            }

            return resolve({
                status: "success",
                data: true,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.createComment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { content, user, post, parent } = data;
            console.log("Creating comment with data:", {
                content,
                user,
                post,
                parent,
            });

            if (!content || !user || !post) {
                return reject(
                    new AppError("Please fill in all required fields", 400)
                );
            }

            // Check if post exists and is active
            console.log("Checking post exists...");
            await checkPost(post);
            console.log("Post check passed");

            console.log("Creating comment...");
            const comment = await Comment.create({
                content: content,
                user: user,
                post: post,
                parent: parent,
            });
            console.log("Comment created:", comment._id);

            // Create notifications
            try {
                if (parent) {
                    console.log("Creating reply notification...");
                    await notiServices.createReplyCommentNotification(
                        comment._id.toString()
                    );
                } else {
                    console.log("Creating comment post notification...");
                    await notiServices.createCommentPostNotification(
                        comment._id.toString(),
                        post
                    );
                }
                console.log("Notification created successfully");
            } catch (notiError) {
                console.log(
                    "Notification error (non-critical):",
                    notiError.message
                );
                // Don't fail the comment creation if notification fails
            }

            // populate user
            console.log("Populating user data...");
            await comment.populate("user", "_id profile");
            console.log("User populated successfully");

            resolve({
                status: "success",
                data: comment,
            });
        } catch (err) {
            console.error("Error in createComment:", err);
            reject(err);
        }
    });
};

exports.getCommentsOfPost = (data, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { post, parent, user } = data;

            // Check if post exists and is active
            await checkPost(post);

            const features = new APIFeatures(
                Comment.find({ post: data.post, parent: parent })
                    .populate("user", "_id profile")
                    .lean(),
                query
            )
                .filter()
                .sort()
                .limitFields()
                .paginate();
            let comments = await features.query;
            const total = await Comment.countDocuments({
                post: data.post,
                parent: parent,
            });

            const commentLikeEntries = comments.map(async (comment) => {
                const isLiked = await this.isCommentLikedByUser(
                    comment._id.toString(),
                    user
                );
                comment.isLiked = isLiked.data;
                return comment;
            });
            const _ = await Promise.all(commentLikeEntries);
            resolve({
                status: "success",
                results: comments.length,
                total,
                data: comments,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.getComment = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const comment = await Comment.findById(id).populate("parent");

            resolve({
                status: "success",
                data: comment,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.updateComment = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkComment = await Comment.findById(id);
            if (checkComment.user.id !== data.user) {
                reject(
                    new AppError(
                        `You do not have permission to update this comment`,
                        403
                    )
                );
            }
            const comment = await Comment.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true,
            });

            if (!comment) {
                reject(new AppError(`Comment not found`, 404));
            }

            resolve({
                status: "success",
                data: comment,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.deleteComment = (id, user) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkComment = await Comment.findById(id);
            if (!checkComment) {
                reject(new AppError(`Comment not found`, 404));
            }
            if (checkComment.user.id !== user) {
                reject(
                    new AppError(
                        `You do not have permission to update this comment`,
                        403
                    )
                );
            }
            const comment = await Comment.findOneAndDelete({ _id: id });

            resolve({
                status: "success",
                data: comment,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.likeComment = (commentId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            //check if comment is still available
            const comment = await Comment.findById(commentId);
            if (!comment) {
                reject(new AppError(`Comment not found`, 404));
            }

            const commentLike = await CommentLike.create({
                comment: commentId,
                user: userId,
            });

            const _ = await notiServices.createLikeCommentNotification(
                userId,
                commentId
            );
            resolve({
                status: "success",
                data: commentLike,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.unlikeComment = (commentId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = await CommentLike.findOneAndDelete({
                user: userId,
                comment: commentId,
            });
            if (!doc) {
                reject(
                    new AppError(`You did not like this comment before`, 400)
                );
            }
            resolve({
                status: "success",
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.isCommentLikedByUser = (commentId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const isLiked = (await CommentLike.exists({
                comment: commentId,
                user: userId,
            }))
                ? true
                : false;

            resolve({
                status: "success",
                data: isLiked,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.getUsersLikingComment = (commentId, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!commentId) {
                return reject(new AppError(`Empty comment id`, 400));
            }

            const comment = await Comment.findById(commentId);

            if (!comment) {
                return reject(new AppError(`Comment not found`, 404));
            }

            const features = new APIFeatures(
                CommentLike.find({ comment: commentId })
                    .populate({
                        path: "user",
                        select: "_id email role profile",
                    })
                    .select("user"),
                query
            )
                .sort()
                .paginate();

            const users = await features.query;

            const data = users.map((user) => user.user);
            const total = await CommentLike.count({ comment: commentId });

            return resolve({
                status: "success",
                total: total,
                data: data,
            });
        } catch (err) {
            reject(err);
        }
    });
};

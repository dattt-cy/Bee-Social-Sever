const AppError = require("../utils/appError");
const Post = require("./../models/postModel");
const Comment = require("./../models/commentModel");
const CommentLike = require("./../models/commentLikeModel");
const APIFeatures = require("./../utils/apiFeatures");

const checkPost = async (postId, reject) => {
    const post = await Post.findById(postId);
    if (!post) {
        reject(new AppError(`Post not found`, 404));
    } else if (!post.isActived) {
        reject(new AppError(`This post no longer existed`, 404));
    } else {
        return true;
    }
};

exports.checkParentComment = (commentId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!commentId) {
                resolve({
                    status: "success",
                    data: true,
                });
            }
            const comment = Comment.findById(commentId);
            if (!comment) {
                reject(new AppError(`Comment not found`, 404));
            }

            resolve({
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
            if (!content || !user || !post) {
                reject(new AppError("Please fill in all required fields", 400));
            }
            if (await checkPost(post, reject)) {
                const comment = await Comment.create({
                    content: content,
                    user: user,
                    post: post,
                    parent: parent,
                });

                let _;

                // populate user
                await comment.populate("user", "_id profile");
                resolve({
                    status: "success",
                    data: comment,
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.getCommentsOfPost = (data, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { post, parent, user } = data;
            if (await checkPost(post, reject)) {
                const features = new APIFeatures(
                    Comment.find({ post: data.post, parent: parent }).lean(),
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
            }
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
                status: "sucess",
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

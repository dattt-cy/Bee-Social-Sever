const Notification = require("./../models/notificationModel");
const AppError = require("./../utils/appError");
const Profile = require("./../models/profileModel");
const Post = require("./../models/postModel");
const Comment = require("./../models/commentModel");
const APIFeatures = require("./../utils/apiFeatures");

exports.getNotificationsByUser = (userId, query, all = true) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError(`Please enter user id`, 400));
            }

            let filter = { recipient: userId };
            if (!all) {
                filter.read = false;
            }
            const features = new APIFeatures(
                Notification.find(filter).lean(),
                query
            )
                .sort()
                .paginate();

            const data = await features.query;

            const promises = data.map(async (notification) => {
                const populate = await populateNotificationContent(
                    notification
                );
                return { ...notification, populate };
            });

            const populatedData = await Promise.all(promises);

            const numUnread = await Notification.countDocuments({
                recipient: userId,
                read: false,
            });
            resolve({
                populatedData,
                numUnread,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.setAllNotificationsRead = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError(`Please fill user id`, 400));
            }

            const affected = await Notification.updateMany(
                { recipient: userId, read: false },
                { read: true },
                {
                    new: true,
                    upsert: true,
                    timestamps: { createdAt: false, updatedAt: false },
                }
            );

            resolve(affected);
        } catch (err) {
            reject(err);
        }
    });
};
exports.setNotificationRead = (notiId, userId, read = true) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!notiId || !userId) {
                return reject(
                    new AppError(`Please fill all required fields`, 400)
                );
            }
            const notification = await Notification.findById(notiId);
            if (!notification) {
                return reject(new AppError(`Notification not found`, 404));
            }

            if (notification.recipient.toString() !== userId) {
                return reject(
                    new AppError(
                        `You do not have permission to perform this action`,
                        401
                    )
                );
            }

            // notification.read = read;
            // console.log(notification.timestamps);
            // notification.timestamps = false;
            // notification.unmarkModified("updatedAt");
            let result;
            if (notification.read !== read) {
                result = await Notification.findOneAndUpdate(
                    { _id: notification._id },
                    { read: read },
                    {
                        new: true,
                        upsert: true,
                        timestamps: { createdAt: false, updatedAt: false },
                    }
                );
            }
            // result = await notification.save();
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};
const populateNotificationContent = async (notification) => {
    const { contentId, subContentId, type } = notification;
    switch (type) {
        case "follow": {
            return await Profile.findOne({ user: contentId }).select(
                "user _id"
            );
        }
        case "like post": {
            return { post: contentId };
        }
        case "comment": {
            return await Comment.findById(subContentId).select(
                "_id content user post parent createdAt"
            );
        }
        case "like comment": {
            return await Comment.findById(contentId).select(
                "_id post parent -user"
            );
        }
        case "reply comment": {
            return await Comment.findById(subContentId).select(
                "_id content user post parent createdAd"
            );
        }
        default: {
            return null;
        }
    }
};

exports.populateNotificationContent = populateNotificationContent;

exports.createNotifications = (
    recipient,
    actors,
    contentId,
    image,
    type,
    subContentId = null
) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!recipient || !actors || !type || !contentId) {
                // return reject(new AppError(`Please fill all requied fields`, 400));
                return resolve({ message: `Please fill all requied fields` });
            }

            const data = await Notification.create({
                actors: actors,
                recipient: recipient,
                contentId: contentId,
                type: type,
                image: image,
                subContentId: subContentId,
            });

            resolve(data);
        } catch (err) {
            resolve(err);
        }
    });
};

exports.createFollowNotification = (
    followerId,
    followingId,
    type = "follow"
) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!followerId || !followingId) {
                return resolve({ message: `Please fill all requied fields` });
            }

            const follower = await Profile.findOne({ user: followerId });

            if (!follower) {
                // return reject(new AppError(`Follower's profile not found`, 400));
                return resolve({ message: `Follower's profile not found` });
            }

            const following = await Profile.findOne({ user: followingId });
            if (!following) {
                // return reject(new AppError(`following's profile not found`, 400));
                return resolve({ message: `Following's profile not found` });
            }

            const notification = await this.createNotifications(
                followingId,
                [follower.slug],
                followerId,
                follower.avatar,
                type
            );
            resolve(notification);
        } catch (err) {
            resolve(err);
        }
    });
};

exports.createLikePostNotification = (likerId, postId, type = "like post") => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!likerId || !postId) {
                // return reject(new AppError(`Please fill all required fields`, 400));
                return resolve({ message: `Please fill all required fields` });
            }

            const liker = await Profile.findOne({ user: likerId });

            if (!liker) {
                // return reject(new AppError(`Liker's profile not found`, 404));
                return resolve({ message: `Liker's profile not found` });
            }

            const post = await Post.findById(postId);

            if (!post) {
                // return reject(new AppError(`Post not found`, 404));
                return resolve({ message: `Post not found` });
            }

            if (likerId === post.user._id.toString()) {
                return resolve({});
            }
            let likePostNotification;

            likePostNotification = await Notification.findOne({
                recipient: post.user._id.toString(),
                contentId: postId,
                type: type,
            });

            if (!likePostNotification) {
                likePostNotification = await this.createNotifications(
                    post.user._id.toString(),
                    [liker.slug],
                    postId,
                    liker.avatar,
                    type
                );
            } else {
                likePostNotification.actors.push(liker.slug);
                likePostNotification.image = liker.avatar;
                likePostNotification.read = false;
                await likePostNotification.save();
            }

            resolve(likePostNotification);
        } catch (err) {
            // reject(err);
            resolve(err);
        }
    });
};

exports.createCommentPostNotification = (
    commentId,
    postId,
    type = "comment"
) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!commentId || !postId) {
                // return reject(new AppError(`Please fill all required fields`, 400));
                return resolve({ message: `Please fill all required fields` });
            }

            const comment = await Comment.findById(commentId);

            if (!comment) {
                // return reject(new AppError(`Comment not found`, 404));
                return resolve({ message: `Comment not found` });
            }

            const post = await Post.findById(postId);

            if (!post) {
                // return reject(new AppError(`Post not found`, 404));
                return resolve({ message: `Post not found` });
            }

            if (comment.user._id.toString() === post.user._id.toString()) {
                return resolve({});
            }

            let commentNotification;
            commentNotification = await Notification.findOne({
                recipient: post.user._id.toString(),
                contentId: postId,
                type: type,
            });

            if (!commentNotification) {
                commentNotification = await this.createNotifications(
                    post.user._id.toString(),
                    [comment.user.profile.slug],
                    postId,
                    comment.user.profile.avatar,
                    type,
                    commentId
                );
            } else {
                commentNotification.actors.push(comment.user.profile.slug);
                commentNotification.image = comment.user.profile.avatar;
                commentNotification.subContentId = commentId;
                commentNotification.read = false;
                await commentNotification.save();
            }

            resolve(commentNotification);
        } catch (err) {
            // reject(err);
            resolve(err);
        }
    });
};

exports.createLikeCommentNotification = (
    likerId,
    commentId,
    type = "like comment"
) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!likerId || !commentId) {
                // return reject(new AppError(`Please fill all required fields`, 400));
                return resolve({ message: `Please fill all required fields` });
            }

            const liker = await Profile.findOne({ user: likerId });

            if (!liker) {
                // return reject(new AppError(`Liker's profile not found`, 404));
                return resolve({ message: `Liker's profile not found` });
            }

            const comment = await Comment.findById(commentId);

            if (!comment) {
                // return reject(new AppError(`Comment not found`, 404));
                return resolve({ message: `Comment not found` });
            }

            if (likerId === comment.user._id.toString()) {
                return resolve({});
            }

            let likeCommentNotification;
            likeCommentNotification = await Notification.findOne({
                recipient: comment.user._id.toString(),
                contentId: comment._id.toString(),
                type: type,
            });

            if (!likeCommentNotification) {
                likeCommentNotification = await this.createNotifications(
                    comment.user._id.toString(),
                    [liker.slug],
                    commentId,
                    liker.avatar,
                    type
                );
            } else {
                likeCommentNotification.actors.push(liker.slug);
                likeCommentNotification.image = liker.avatar;
                likeCommentNotification.read = false;
                await likeCommentNotification.save();
            }

            resolve(likeCommentNotification);
        } catch (err) {
            // reject(err);
            resolve(err);
        }
    });
};

exports.createReplyCommentNotification = (
    commentId,
    type = "reply comment"
) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!commentId) {
                // return reject(new AppError(`Please fill all required fields`, 400));
                return resolve({ message: `Please fill all required fields` });
            }

            const comment = await Comment.findById(commentId)
                .populate("post")
                .populate("parent");
            if (!comment) {
                // return reject(new AppError(`Comment not found`, 404));
                return resolve({ message: `Comment not found` });
            }
            if (
                comment.parent.user._id.toString() ===
                comment.user._id.toString()
            ) {
                return resolve({});
            }
            let replyCommentNotification;
            replyCommentNotification = await Notification.findOne({
                recipient: comment.parent.user._id.toString(),
                contentId: comment.parent._id.toString(),
                type: type,
            });
            if (!replyCommentNotification) {
                replyCommentNotification = await this.createNotifications(
                    comment.parent.user._id.toString(),
                    [comment.user.profile.slug],
                    comment.parent._id.toString(),
                    comment.user.profile.avatar,
                    type,
                    commentId
                );
            } else {
                replyCommentNotification.actors.push(comment.user.profile.slug);
                replyCommentNotification.image = comment.user.profile.avatar;
                replyCommentNotification.subContentId = commentId;
                replyCommentNotification.read = false;
                await replyCommentNotification.save();
            }

            if (
                comment.post.user._id.toString() !==
                comment.parent.user._id.toString()
            ) {
                const temp = await this.createCommentPostNotification(
                    commentId,
                    comment.post._id.toString()
                );
                console.log(temp);
            }
            resolve(replyCommentNotification);
        } catch (err) {
            // reject(err);
            resolve(err);
        }
    });
};

exports.createSharePostNotification = (postId, type = "share post") => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!postId) {
                return resolve({ message: `Please fill all required fields` });
            }

            const post = await Post.findById(postId);

            if (!post) {
                return resolve({ message: `Post not found` });
            }

            if (post.user._id.toString() === post.parent.user._id.toString()) {
                return resolve({ message: `` });
            }
            let sharePostNotification;

            sharePostNotification = await Notification.findOne({
                recipient: post.parent.user._id.toString(),
                contentId: post.parent._id.toString(),
            });

            if (!sharePostNotification) {
                sharePostNotification = await this.createNotifications(
                    post.parent.user._id.toString(),
                    [post.user.profile.slug],
                    post.parent._id.toString(),
                    post.user.profile.avatar,
                    type
                );
            } else {
                sharePostNotification.actors.push(post.user.profile.slug);
                sharePostNotification.image = post.user.profile.avatar;
                sharePostNotification.read = false;
                await sharePostNotification.save();
            }
            resolve(sharePostNotification);
        } catch (err) {
            resolve(err);
        }
    });
};

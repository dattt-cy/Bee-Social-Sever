const mongoose = require("mongoose");

const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");
const Feed = require("./../models/feedModel");
const BusinessPost = require("./../models/businessPostModel");
const User = require("./../models/userModel");
const Post = require("./../models/postModel");
const Follow = require("./../models/followModel");
const postServices = require("./postServices");
const trendingServices = require("./trendingServices");
const followServices = require("./followServices");

exports.getFeedByUser = (user, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!user) {
                reject(new AppError(`Empty user`, 400));
            }
            const currentDate = Date.now();
            const numOfFollow = await followServices.getNumberOfFollows(user);
            if (numOfFollow) {
                const feedCount = await Feed.countDocuments({
                    user: user,
                    seen: false,
                });
                console.log(feedCount);
                if (feedCount < 5) {
                    // Ưu tiên đề xuất bài quảng cáo cho user mới
                    await this.addAdsToUserFeed(user);

                    // Sau đó đề xuất bài trending nếu cần
                    if (numOfFollow.data.NumberOfFollowing === 0) {
                        await this.addSuggestedPostToUserFeed(user, 4); // 1 quảng cáo + 4 trending
                    } else {
                        await this.addSuggestedPostToUserFeed(user, 1);
                    }
                }
            }
            const features = new APIFeatures(
                Feed.find({
                    user: user,
                    dateToBeSeen: { $lte: currentDate },
                })
                    .populate({
                        path: "post",
                        select: "content images imageVideo categories numLikes numComments numShares createdAt user isActived parent id",
                        match: { isActived: true },
                        options: { applyHooks: true },
                        populate: {
                            path: "parent",

                            select: "content images imageVideo categories numLikes numComments numShares createdAt isActived user id",
                            match: { isActived: true },
                            options: { applyHooks: true },
                        },
                    })
                    .select("post seen type isLiked createdAt"),
                query
            )
                .sort()
                .paginate();

            let feeds = await features.query.lean();
            // XÓA đoạn lọc trùng này:
            // feeds = Array.from(new Set(feeds.map((feed) => feed.post._id))).map(
            //     (postId) => {
            //         return feeds.find((feed) => feed.post._id === postId);
            //     }
            // );
            // Thay bằng lọc bài viết hợp lệ:
            feeds = feeds.filter((feed) => feed.post && feed.post.isActived);
            const isLikedPromises = feeds.map(async (feed) => {
                const isLiked = await postServices.isPostLikedByUser(
                    feed.post._id.toString(),
                    user
                );
                feed.post.isLiked = isLiked.data;
                return feed;
            });

            const data = await Promise.all(isLikedPromises);
            // console.log(data);
            // probability for adding post to user feed
            const probability = Math.random();
            console.log(probability);
            if (probability < 0.3) {
                await this.addAdsToUserFeed(user);
            }
            const total = await Feed.countDocuments({
                user: user,
                dateToBeSeen: { $lte: currentDate },
            });
            resolve({
                status: "success",
                total: total,
                data: feeds,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.setFeedSeen = (userId, feeds) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId || !feeds) {
                return reject(
                    new AppError(`Please fill all required fields`, 400)
                );
            }

            const user = await User.findById(userId);
            if (!user) {
                return reject(
                    new AppError(`Please fill all required fields`, 400)
                );
            }
            const affected = await Feed.updateMany(
                { user: user._id, _id: { $in: feeds } },
                { $set: { seen: true } }
            );

            resolve({
                status: "success",
                data: affected,
            });
        } catch (err) {
            reject(err);
        }
    });
};
exports.addAdsToUserFeed = (user) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!user) {
                return reject(
                    new AppError(`Please fill all required fields`, 400)
                );
            }
            const currentDate = new Date();
            const ads = await BusinessPost.aggregate([
                {
                    $match: {
                        status: "approved",
                        activeDate: { $lt: currentDate },
                        expireDate: { $gt: currentDate },
                    },
                },
                {
                    $sample: { size: 1 },
                },
            ]);
            let feed;
            if (ads.length > 0) {
                await Feed.deleteMany({ post: ads[0], user: user });
                feed = await Feed.create({
                    post: ads[0],
                    type: "advertisement",
                    user: user,
                });
            }
            resolve({
                data: feed,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.addSuggestedPostToUserFeed = (userId, count = 1) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                reject(new AppError(`Please fill all required fields`, 400));
            }

            const user = await User.findById(userId);
            if (!user) {
                reject(new AppError(`User not found`, 404));
            }

            const { preferences } = user;
            if (preferences.length <= 0 || !preferences) {
                resolve([]);
            }
            const trendingPosts = (
                await trendingServices.getTrendingPostsByCategories(
                    preferences.join(",")
                )
            ).data;

            let suggestedPosts = trendingPosts.reduce((prev, curr) => {
                let take = count;
                if (count > curr.posts.length) {
                    take = curr.posts.length;
                }
                if (take > 0) {
                    prev.push(curr.posts.slice(0, take));
                }
                return prev;
            }, []);
            suggestedPosts = suggestedPosts.flat(Infinity);
            // console.log(suggestedPosts.length, suggestedPosts);
            const currentDate = new Date();
            const feedEntries = suggestedPosts.map((post) => ({
                user: userId,
                post: post._id.toString(),
                type: "suggested",
                createdAt: new Date(
                    currentDate.getTime() + getRandomInt(-5, 0) * 60000
                ),
            }));

            const feeds = await Feed.create(feedEntries);
            resolve({
                status: "success",
                results: feeds.length,
                data: feeds,
            });
        } catch (err) {
            reject(err);
        }
    });
};

function getRandomInt(min = 0, max = 1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.addFollowingUserPostToFeed = (followerId, followingId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!followerId || !followingId) {
                return reject(
                    new AppError(`Please fill all required fields`, 400)
                );
            }

            const followerPromise = User.findById(followerId);
            const followingPromise = User.findById(followingId);

            const [follower, following] = await Promise.all([
                followerPromise,
                followingPromise,
            ]);

            if (!follower || !following) {
                return reject(new AppError(`User not found`, 404));
            }

            // get latest posts by followed user
            const posts = await postServices.getLatestPostsByUser(following);
            const currentDate = new Date();
            const feedEntries = posts.map((post) => ({
                user: followerId,
                post: post.id,
                createdAt: new Date(
                    currentDate.getTime() + getRandomInt(-5, 5) * 60000
                ),
            }));

            const feeds = await Feed.create(feedEntries);

            resolve(feeds);
        } catch (err) {
            reject(err);
        }
    });
};

exports.removeUnfollowedUserPostFromFeed = (followerId, followingId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!followerId || !followingId) {
                reject(new AppError(`Please fill all required fields`, 400));
            }

            // match post of user that is unfollowed by an other user
            const deletablePosts = await Feed.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(followerId) } },
                {
                    $lookup: {
                        from: "posts",
                        localField: "post",
                        foreignField: "_id",
                        as: "populatedPost",
                    },
                },
                {
                    $unwind: "$populatedPost",
                },
                {
                    $match: {
                        "populatedPost.user": new mongoose.Types.ObjectId(
                            followingId
                        ),
                    },
                },
                {
                    $project: {
                        _id: 0,
                        post: 1,
                    },
                },
            ]);

            // filter post id only
            const deletedPosts = deletablePosts.map((post) => post.post);

            // delete all feed
            const result = await Feed.deleteMany({
                user: new mongoose.Types.ObjectId(followerId),
                post: { $in: deletedPosts },
            });

            // return affected documents count
            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

exports.addNewPostToFollowingUserFeed = (postId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!postId || !userId) {
                reject(new AppError(`Please fill all required fields`, 400));
            }

            const followers = await Follow.find({ following: userId }).select(
                "follower"
            );

            // Luôn thêm bài viết vào Feed của chính user
            let feedEntries = [
                {
                    user: userId,
                    post: postId,
                },
            ];

            if (followers.length > 0) {
                feedEntries = feedEntries.concat(
                    followers.map((follower) => ({
                        user: follower.follower,
                        post: postId,
                    }))
                );
            }

            const feeds = await Feed.create(feedEntries);
            resolve({
                status: "success",
                data: feeds,
            });
        } catch (err) {
            reject(err);
        }
    });
};

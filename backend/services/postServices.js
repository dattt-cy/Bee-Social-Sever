const Post = require("./../models/postModel");
const BusinessPost = require("./../models/businessPostModel");
const LikePost = require("./../models/likePostModel");
const User = require("./../models/userModel");
const HashtagPost = require("./../models/hashtagPostModel");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");
const Hashtag = require("./../models/hashtagModel");

const feedServices = require("./feedServices");
const notiServices = require("./notificationServices");
const followServices = require("./followServices");
const { post } = require("jquery");

const checkDeletingPermission = async (postId, reject, userId) => {
    // admins always have permission to delete post
    const user = await User.findById(userId);
    if (user.role === "admin") {
        return true;
    }
    const post = await Post.findById(postId);
    if (!post) {
        reject(new AppError(`Post not found`, 404));
    } else if (post.user._id.toString() !== userId) {
        reject(
            new AppError(
                `You do not have permission to perform this action`,
                403
            )
        );
    } else if (!post.isActived) {
        reject(new AppError(`This post no longer exists`, 404));
    } else {
        return true;
    }
};

const checkPost = async (postId, reject, userId = null) => {
    const post = await Post.findById(postId);
    if (!post) {
        reject(new AppError(`Post not found`, 404));
    } else if (userId && post.user._id.toString() !== userId) {
        // only user of the post has permission to update post
        reject(
            new AppError(
                `You do not have permission to perform this action`,
                403
            )
        );
    } else if (!post.isActived) {
        reject(new AppError(`This post no longer exists`, 404));
    } else {
        return true;
    }
};

exports.createPost = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // set the root parent for sharing post
            let { content, images, imageVideo, categories, user, parent } =
                data;
            if (parent) {
                const parentPost = await Post.findById(parent);
                if (parentPost.parent) {
                    parent = parentPost.parent;
                }
            }
            const post = await Post.create({
                content: content,
                images: images,
                imageVideo: imageVideo,
                categories: categories,
                user: user,
                parent: parent,
                isActived: true, // Thêm dòng này!
            });

            if (post) {
                const result = await Post.findById(post._id);
                if (parent) {
                    const _ = await notiServices.createSharePostNotification(
                        post._id.toString()
                    );
                    console.log(_);
                }
                const _ = await feedServices.addNewPostToFollowingUserFeed(
                    post.id,
                    user
                );
                resolve({
                    status: "success",
                    data: result,
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.updatePost = (postId, userId, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let post;
            if (await checkPost(postId, reject, userId)) {
                post = await Post.findByIdAndUpdate(postId, data, {
                    new: true,
                    runValidators: true,
                });

                if (!post) {
                    reject(new AppError(`Post not found`, 404));
                }

                resolve({
                    status: "success",
                    data: post,
                });
            }
            resolve({
                status: "success",
                data: post,
            });
        } catch (err) {
            reject(err);
        }
    });
};
exports.deletePost = (postId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (
                (await checkDeletingPermission(postId, reject, userId)) === true
            ) {
                const doc = await Post.findByIdAndUpdate(postId, {
                    isActived: false,
                });

                if (!doc) {
                    reject(
                        new AppError(`You did not like this post before`, 400)
                    );
                }

                resolve({
                    status: "success",
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.getPostById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const post = await Post.findById(id);
            if (!post) {
                reject(new AppError(`Post not found`, 404));
            } else if (!post.isActived) {
                reject(new AppError(`This post is longer existed`, 404));
            } else {
                resolve({
                    status: "success",
                    data: post,
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.getPostsByMe = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const posts = await Post.find({
                user: userId,
                isActived: true,
            }).sort({
                createdAt: -1,
            });
            const postsWithLikeStatus = await Promise.all(
                posts.map(async (post) => {
                    const isLiked = (await LikePost.exists({
                        post: post._id,
                        user: userId,
                    }))
                        ? true
                        : false;
                    return { ...post.toObject(), isLiked };
                })
            );
            resolve({
                status: "success",
                results: posts.length,
                data: postsWithLikeStatus,
            });
        } catch (err) {
            reject(err);
        }
    });
};
exports.getPostByUserId = (userId, myId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const posts = await Post.find({
                user: userId,
                isActived: true,
            }).sort({
                createdAt: -1,
            });
            const postsWithLikeStatus = await Promise.all(
                posts.map(async (post) => {
                    const isLiked = (await LikePost.exists({
                        post: post._id,
                        user: myId,
                    }))
                        ? true
                        : false;
                    return { ...post.toObject(), isLiked };
                })
            );
            resolve({
                status: "success",
                results: posts.length,
                data: postsWithLikeStatus,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.isPostLikedByUser = (postId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const isLiked = (await LikePost.exists({
                post: postId,
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

exports.likePost = (postId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if ((await checkPost(postId, reject)) === true) {
                const likePost = await LikePost.create({
                    post: postId,
                    user: userId,
                });

                const _ = await notiServices.createLikePostNotification(
                    userId,
                    postId
                );
                console.log(_);
                resolve({
                    status: "success",
                    data: likePost,
                });
            }
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
};

exports.unlikePost = (postId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if ((await checkPost(postId, reject)) === true) {
                const doc = await LikePost.findOneAndDelete({
                    user: userId,
                    post: postId,
                });

                if (!doc) {
                    reject(
                        new AppError(`You did not like this post before`, 400)
                    );
                }

                resolve({
                    status: "success",
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.getPostsByHashtag = (hashtag, query, media = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!hashtag) {
                reject(`Hashtag empty`, 400);
            }
            const hashtagId = await Hashtag.find({
                name: { $regex: new RegExp(hashtag, "i") },
            });
            console.log(hashtagId);
            if (hashtagId.length == 0)
                resolve({
                    status: "success",
                    results: 0,
                    data: null,
                });
            const hashtagPosts = await HashtagPost.find({
                hashtag: hashtagId[0]._id,
            });
            if (!hashtagPosts) {
                reject(new AppError(`Not found`, 404));
            }
            const postIds = hashtagPosts.map((post) => post.post.toString());

            let filter = { _id: { $in: postIds } };
            if (media === "media")
                filter.$and = [
                    { images: { $ne: null } }, // Ensure images is not null
                    { "images.0": { $exists: true } }, // Ensure images has at least one element
                ];

            console.log(filter);
            const postFeatures = new APIFeatures(Post.find(filter), query)
                // .filter()
                .limitFields()
                .sort()
                .paginate();
            postFeatures.query = postFeatures.query.populate({
                path: "user",
                select: "_id email profile",
                populate: {
                    path: "profile",
                    model: "Profile",
                    select: "avatar firstname lastname slug",
                },
            });
            const posts = await postFeatures.query;
            resolve({
                status: "success",
                results: posts.length,
                data: posts,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.searchPosts = (searchText, query, media = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!searchText) reject(new AppError(`Empty search string`, 400));
            // const regex = new RegExp(`(?<!#)\\b${searchText}\\b`, "iu");
            const regex = new RegExp(
                `(?<![#\\p{L}])${searchText}(?![#\\p{L}])`,
                "iu"
            );
            let filter = { content: regex };
            if (media === "media")
                filter.$and = [
                    { images: { $ne: null } }, // Ensure images is not null
                    { "images.0": { $exists: true } }, // Ensure images has at least one element
                ];
            const features = new APIFeatures(Post.find(filter), query)
                .sort()
                .paginate();

            const posts = (await features.query) ?? [];

            if (!posts) reject(new AppError(`Not found`, 404));

            resolve({
                status: "success",
                results: posts.length,
                data: posts,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.createBusinessPost = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let {
                content,
                images,
                imageVideo,
                categories,
                user,
                activeDate,
                expireDate,
                targetLocation,
                targetGender,
                targetAge,
                potentialReach,
            } = data;
            if (!targetAge) {
                targetAge = [0, 999];
            }
            const post = await BusinessPost.create({
                content: content,
                images: images,
                imageVideo: imageVideo,
                categories: categories,
                user: user,
                activeDate: activeDate,
                expireDate: expireDate,
                targetLocation: targetLocation,
                targetGender: targetGender,
                targetAge: targetAge,
                potentialReach: potentialReach,
            });

            if (post) {
                resolve({
                    status: "success",
                    data: post,
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.getPostsFromProfile = (userId, query, myId = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError(`Please specific user id`, 400));
            }

            const features = new APIFeatures(
                Post.find({ user: userId, isActived: true }).lean(),
                query
            )
                .sort()
                .paginate();

            const posts = await features.query;

            if (!myId) {
                myId = userId;
            }
            const promises = posts.map(async (post) => {
                const isLiked = await this.isPostLikedByUser(
                    post._id.toString(),
                    myId
                );
                return { ...post, isLiked: isLiked.data };
            });
            const data = await Promise.all(promises);
            const total = await Post.countDocuments({
                user: userId,
                isActived: true,
            });
            resolve({
                status: "success",
                total,
                data: data,
            });
        } catch (err) {
            reject(err);
        }
    });
};
exports.getPostsByUser = (userId, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                reject(new AppError(`Please fill all required fields`, 400));
            }

            const features = new APIFeatures(
                Post.find({ user: userId, isActived: true }),
                query
            )
                .sort()
                .paginate();
            const posts = await features.query;
            resolve(posts);
        } catch (err) {
            reject(err);
        }
    });
};

exports.getLatestPostsByUser = (
    userId,
    page = 1,
    limit = 5,
    sort = "-createdAt"
) => {
    return new Promise(async (resolve, reject) => {
        let query = {
            limit: limit,
            page: page,
            sort: sort,
        };
        const posts = await this.getPostsByUser(userId, query);
        resolve(posts);
    });
};

exports.getUsersLikingPost = (postId, userId, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!postId) {
                return reject(new AppError(`Empty post Id`, 400));
            }

            const post = await Post.findById(postId);
            if (!post || !post?.isActived) {
                return reject(new AppError(`Post not found`, 404));
            }

            const features = new APIFeatures(
                LikePost.find({ post: postId })
                    .populate({
                        path: "user",
                        select: "_id email role profile",
                    })
                    .select("user")
                    .lean(),
                query
            )
                .sort()
                .paginate();

            const users = await features.query;
            const promises = users.map(async (user) => {
                // console.log("0", userId, user._id.toString());
                const isFollowing = (
                    await followServices.isFollowing(userId, user.user._id)
                ).data;
                console.log(isFollowing);
                user.user.profile.isFollowing = isFollowing;
                return { ...user.user };
            });
            // const data = users.map((user) => user.user);
            const data = await Promise.all(promises);
            console.log(data);
            const total = await LikePost.countDocuments({ post: postId });
            resolve({
                status: "success",
                total: total,
                data: data,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.getUsersSharingPost = (postId, userId, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!postId) {
                return reject(new AppError(`Empty post Id`, 400));
            }

            const post = await Post.findById(postId);
            if (!post || !post?.isActived) {
                return reject(new AppError(`Post not found`, 404));
            }

            if (!query.fields) query.fields = "-parent";
            const features = new APIFeatures(
                Post.find({ parent: postId, isActived: true }).lean(),
                query
            )
                .sort()
                .paginate();

            const posts = await features.query;
            const total = await Post.countDocuments({
                parent: postId,
                isActived: true,
            });

            const promises = posts.map(async (post) => {
                delete post.parent;
                const isLiked = (
                    await this.isPostLikedByUser(post._id.toString(), userId)
                ).data;
                console.log(isLiked);
                return { ...post, isLiked };
            });

            const result = await Promise.all(promises);
            console.log(result);
            resolve({
                status: "success",
                total: total,
                data: result,
            });
        } catch (err) {
            reject(err);
        }
    });
};

exports.getSharedPostsByUser = (userId, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError(`Please fill user id`, 400));
            }
            console.log(query);
            const features = new APIFeatures(
                Post.find({
                    user: userId,
                    parent: { $ne: null },
                    isActived: true,
                }).lean(),
                query
            )
                .paginate()
                .sort();

            const posts = await features.query;

            const promises = posts.map(async (post) => {
                const isLiked = (
                    await this.isPostLikedByUser(post._id.toString(), userId)
                ).data;
                return { ...post, isLiked };
            });

            const result = await Promise.all(promises);
            resolve({
                status: "success",
                total: result.length ?? 0,
                data: result,
            });
        } catch (err) {
            return reject(err);
        }
    });
};

exports.getLikedPostsByUser = (userId, query) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError(`Please fill user id`, 400));
            }
            query.sort = "-createdAt";
            const features = new APIFeatures(
                LikePost.find({ user: userId }).populate("post").lean(),
                query
            )
                .paginate()
                .sort();

            const likeposts = await features.query;

            let posts = likeposts.map((post) => post.post);
            // posts = posts.filter((post) => post.isActived === true);
            posts = posts.filter(
                (post) =>
                    post?.isActived !== false &&
                    !post?.parent?.isActived !== false
            );
            console.log(posts[0]);
            const result = posts.map((post) => ({
                ...post,
                isLiked: true,
            }));

            resolve({
                status: "success",
                total: result.length ?? 0,
                data: result,
            });
        } catch (err) {
            return reject(err);
        }
    });
};

const Post = require("./../models/postModel");
const LikePost = require("./../models/likePostModel");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

const { post } = require("jquery");

const checkDeletingPermission = async (postId, reject, userId) => {
    // admins always have permission to delete post
    const user = await User.findById(userId);
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

            // Nếu có parent (shared post), kiểm tra parent tồn tại
            if (parent) {
                const parentPost = await Post.findById(parent);
                if (!parentPost || !parentPost.isActived) {
                    return reject(new AppError(`Parent post not found`, 404));
                }
            }

            const post = await Post.create({
                content: content,
                images: images,
                imageVideo: imageVideo,
                categories: categories,
                user: user,
                parent: parent || null, // Thêm parent field
            });

            if (post) {
                // Nếu là shared post, cập nhật số lượng share cho parent
                if (parent) {
                    await Post.setNumShares(parent);
                }

                // Lấy post vừa tạo với đầy đủ thông tin populate
                const result = await Post.findById(post._id)
                    .populate({
                        path: "user",
                        populate: { path: "profile" },
                    })
                    .populate({
                        path: "parent",
                        populate: {
                            path: "user",
                            populate: { path: "profile" },
                        },
                    });

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
            })
                .populate({
                    path: "user",
                    populate: { path: "profile" },
                })
                .populate({
                    path: "parent", // Populate parent post
                    populate: {
                        path: "user",
                        populate: { path: "profile" },
                    },
                })
                .sort({
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
            })
                .populate({
                    path: "user",
                    populate: { path: "profile" },
                })
                .populate({
                    path: "parent", // Populate parent post
                    populate: {
                        path: "user",
                        populate: { path: "profile" },
                    },
                })
                .sort({
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

exports.getPostsFromProfile = (userId, query, myId = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError(`Please specific user id`, 400));
            }

            const features = new APIFeatures(
                Post.find({ user: userId, isActived: true })
                    .populate({
                        path: "user",
                        populate: { path: "profile" },
                    })
                    .populate({
                        path: "parent", // Populate parent post
                        populate: {
                            path: "user",
                            populate: { path: "profile" },
                        },
                    })
                    .lean(),
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
            // 1) Validate postId
            if (!postId) {
                return reject(new AppError(`Empty post Id`, 400));
            }

            // 2) Kiểm tra post tồn tại và active
            const post = await Post.findById(postId);
            if (!post || !post.isActived) {
                return reject(new AppError(`Post not found`, 404));
            }

            // 3) Khởi tạo query lấy LikePost, populate user
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

            // 4) Thực thi
            const likeEntries = await features.query;

            // 5) Map sang mảng User thuần (entry.user) và vẫn giữ userId truyền vào
            //    (nếu cần dùng sau này, ví dụ ghi log, gắn thêm flags...)
            const users = likeEntries.map((entry) => ({
                ...entry.user,
                // gắn thêm trường currentUserId cho client nếu bạn muốn
                currentUserId: userId,
            }));

            // 6) Đếm tổng lượt thích
            const total = await LikePost.countDocuments({ post: postId });

            // 7) Trả về
            resolve({
                status: "success",
                total,
                data: users,
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

exports.getRandomPost = async function (userId) {
    try {
        // Lấy posts giống như getPostsByMe - KHÔNG dùng .lean()
        const posts = await Post.find({ isActived: true })
            .populate({
                path: "user",
                populate: { path: "profile" },
            })
            .populate({
                path: "parent", // Populate parent post
                populate: {
                    path: "user",
                    populate: { path: "profile" },
                },
            })
            .sort({ createdAt: -1 });

        // Kiểm tra shared posts
        const sharedPosts = posts.filter((p) => p.parent);

        if (!posts.length) {
            throw new AppError("No posts found", 404);
        }

        // Process posts giống hệt như getPostsByMe
        const postsWithLikeStatus = await Promise.all(
            posts.map(async (post) => {
                const isLiked = (await LikePost.exists({
                    post: post._id,
                    user: userId,
                }))
                    ? true
                    : false;

                return { ...post.toObject(), isLiked }; // Dùng .toObject() như getPostsByMe
            })
        );

        const finalShared = postsWithLikeStatus.filter((p) => p.parent);

        return {
            status: "success",
            total: postsWithLikeStatus.length,
            data: postsWithLikeStatus,
        };
    } catch (error) {
        throw error;
    }
};

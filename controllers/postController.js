const catchAsync = require("./../utils/catchAsync");
const postServices = require("./../services/postServices");
const factory = require("./../controllers/handlerFactory");
const Post = require("./../models/postModel");

exports.getAllPost = factory.getAll(Post);

exports.setUserId = (req, res, next) => {
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.createPost = catchAsync(async (req, res, next) => {
    const data = await postServices.createPost(req.body);
    res.status(201).json(data);
});

exports.updatePost = catchAsync(async (req, res, next) => {
    delete req.body.user;
    const data = await postServices.updatePost(
        req.params.id,
        req.user.id,
        req.body
    );
    res.status(200).json(data);
});
exports.deletePost = catchAsync(async (req, res, next) => {
    const data = await postServices.deletePost(req.params.id, req.user.id);
    res.status(204).json(data);
});
exports.getPostById = catchAsync(async (req, res, next) => {
    const data = await postServices.getPostById(req.params.id);
    res.status(200).json(data);
});

exports.likePost = catchAsync(async (req, res, next) => {
    const data = await postServices.likePost(req.params.id, req.user.id);
    res.status(201).json(data);
});

exports.unlikePost = catchAsync(async (req, res, next) => {
    const data = await postServices.unlikePost(req.params.id, req.user.id);
    res.status(200).json(data);
});

exports.isPostLikedByUser = catchAsync(async (req, res, next) => {
    const data = await postServices.isPostLikedByUser(
        req.params.id,
        req.user.id
    );
    res.status(200).json(data);
});

exports.getAllPostsByMe = catchAsync(async (req, res, next) => {
    // const data = await postServices.getPostsByMe(req.user.id);
    const data = await postServices.getPostsFromProfile(req.user.id, req.query);
    res.status(200).json(data);
});
exports.getPostByUserId = catchAsync(async (req, res, next) => {
    const data = await postServices.getPostsFromProfile(
        req.params.id,
        req.query,
        req.user.id
    );
    res.status(200).json(data);
});

exports.getUsersLikingPost = catchAsync(async (req, res, next) => {
    const data = await postServices.getUsersLikingPost(
        req.params.id,
        req.user.id,
        req.query
    );
    res.status(200).json(data);
});

exports.getUsersSharingPost = catchAsync(async (req, res, next) => {
    console.log(req.user);
    const data = await postServices.getUsersSharingPost(
        req.params.id,
        req.user.id,
        req.query
    );
    res.status(200).json(data);
});

exports.getSharedPostsByUser = catchAsync(async (req, res, next) => {
    let userId = req.user.id;
    if (req.params.id) userId = req.params.id;
    const data = await postServices.getSharedPostsByUser(userId, req.query);

    res.status(200).json(data);
});

exports.getLikedPostsByUser = catchAsync(async (req, res, next) => {
    let userId = req.user.id;
    if (req.params.id) userId = req.params.id;
    const data = await postServices.getLikedPostsByUser(userId, req.query);
    res.status(200).json(data);
});
exports.getRandomPost = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit, 10) || 5;

    const result = await postServices.getRandomPost(req.user.id, limit);

    res.status(200).json({
        status: "success",
        total: result.total,
        data: result.data,
    });
});

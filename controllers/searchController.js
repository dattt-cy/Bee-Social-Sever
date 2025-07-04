const catchAsync = require("./../utils/catchAsync");
const postServices = require("./../services/postServices");
const profileServices = require("./../services/profileServices");
const AppError = require("./../utils/appError");

exports.searchUsers = catchAsync(async (req, res, next) => {
    if (!req.query.q) return next(new AppError(`Empty search string`, 400));
    const data = await profileServices.searchUser(req.query.q, req.query);
    res.status(200).json(data);
});

exports.searchPosts = catchAsync(async (req, res, next) => {
    if (!req.query.q) return next(new AppError(`Empty search string`, 400));

    if (!req.query.limit) req.query.limit = 20;
    data = await postServices.searchPosts(
        req.query.q,
        req.query,
        req.query.media
    );
    res.status(200).json(data);
});

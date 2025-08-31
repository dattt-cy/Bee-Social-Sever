const AppError = require("../utils/appError");
const trendingServices = require("./../services/trendingServices");
const catchAsync = require("./../utils/catchAsync");

exports.getAllTrendingHashtag = catchAsync(async (req, res, next) => {
    const data = await trendingServices.determineTrendingHashtags(30);
    // const da = await hashtagServices.createHashtags(req.body.content);
    res.status(200).json(data);
});

exports.setLimit = (req, res, next) => {
    if (!req.query.limit) req.query.limit = 10;
    next();
};
exports.getTrendingHashtag = catchAsync(async (req, res, next) => {
    const data = await trendingServices.getTrendingHashtag(req.query.limit);
    res.status(200).json(data);
});

exports.getTrendingPosts = catchAsync(async (req, res, next) => {
    if (!req.query.category)
        return next(new AppError(`Empty category query`, 400));
    const data = await trendingServices.getTrendingPostsByCategories(
        req.query.category,
        req.user?.id
    );
    res.status(200).json(data);
});

exports.getTrendingPostsByUser = catchAsync(async (req, res, next) => {
    let preferences = req.user.preferences;
    if (preferences.length === 0) {
        preferences = [
            "65392b8f96ed3a51de029346",
            "653a96bd9bbda0b0c41d4b67",
            "653b507781c5cc89327401fb",
            "65392b8496ed3a51de029343",
            "656e01887df01c1616434a9a",
        ];
    }
    const data = await trendingServices.getTrendingPostsByCategories(
        preferences.join(","),
        req.user.id
    );

    res.status(200).json(data);
});

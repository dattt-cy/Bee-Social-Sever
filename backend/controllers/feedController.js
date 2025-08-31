const catchAsync = require("./../utils/catchAsync");
const feedServices = require("./../services/feedServices");

exports.setQuery = (req, res, next) => {
  if (!req.query.limit) req.query.limit = "5";
  if (!req.query.sort) req.query.sort = "seen,-createdAt";
  next();
};

exports.getFeedByUser = catchAsync(async (req, res, next) => {
  const data = await feedServices.getFeedByUser(req.user.id, req.query);
  res.status(200).json(data);
});

exports.setFeedSeen = catchAsync(async (req, res, next) => {
  const data = await feedServices.setFeedSeen(req.user.id, req.body.feeds);
  res.status(200).json(data);
});

exports.getRandomAds = catchAsync(async (req, res, next) => {
  const data = await feedServices.addAdsToUserFeed(req.user.id);
  res.status(200).json(data);
});

exports.getFollowingUserFeed = catchAsync(async (req, res, next) => {
  const data = await feedServices.addFollowingUserPostToFeed(
    req.user.id,
    req.body.following
  );
  res.status(200).json(data);
});

exports.getRemovedFeed = catchAsync(async (req, res, next) => {
  const data = await feedServices.removeUnfollowedUserPostFromFeed(
    req.user.id,
    req.body.following
  );

  res.status(200).json(data);
});

exports.getSuggestedFeed = catchAsync(async (req, res, next) => {
  const data = await feedServices.addSuggestedPostToUserFeed(req.user.id);
  res.status(200).json(data);
});



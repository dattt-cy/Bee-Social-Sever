const catchAsync = require('./../utils/catchAsync');
const followService = require('../services/followServices');

exports.followingOtherUser = catchAsync(async (req, res) => {
    console.log(req.body)
    const data = await followService.followingOtherUser(req.body.id, req.user.id);
    return res.status(200).json(
        data
    );
});
exports.getAllFollowings = catchAsync(async(req, res) => {
    const data = await followService.getAllFollowings(req.params.id,req.user.id);
        return res.status(200).json(
            data
        )

});
exports.getAllFollowers = catchAsync(async(req, res) => {
    const data = await followService.getAllFollowers(req.params.id, req.user.id);
        return res.status(200).json(
            data
        )
    
});
exports.unfollow = catchAsync(async(req, res) => {
    const data = followService.unfollow(req.user.id, req.params.followingId);
        return res.status(200).json(
            data
        )
});
exports.getNumberOfFollows = catchAsync(async(req, res) => {
    const data = await followService.getNumberOfFollows(req.params.id);
        return res.status(200).json(
            data
        )
});

exports.getMyFollowingList = catchAsync(async(req, res) => {
    const data = await followService.getMyFollowingList(req.user.id);
        return res.status(200).json(
            data
        )

});
exports.getMyFollowerList = catchAsync(async (req, res) => {
    const data = await followService.getMyFollowerList(req.user.id)
        return res.status(200).json(
            data
        )
    
});
exports.getMyNumberOfFollows = catchAsync(async(req, res) => {
    const data = await followService.getNumberOfFollows(req.user.id);
        return res.status(200).json(
            data
        )
});
exports.isFollowing = catchAsync(async(req, res) => {
    const data = await followService.isFollowing(req.user.id,req.params.id);
        return res.status(200).json(
            data
        )
});

exports.suggestFollow = catchAsync(async(req, res) => {
    const data = await followService.suggestFollow(req.user.id);
        return res.status(200).json(
            data
        )
    });

exports.getFriends = catchAsync(async(req, res, next) => {
    const data = await followService.getFriends(req.user.id);
        return res.status(200).json(data)
});
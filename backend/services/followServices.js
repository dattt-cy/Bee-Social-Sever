const User = require("../models/userModel");
const FollowModel = require("./../models/followModel");
const ProfileModel = require("./../models/profileModel");
const UserPreferenceModel = require("./../models/userPreferenceModel");
const AppError = require("./../utils/appError");
const feedServices = require("./feedServices");
const notiServices = require("./notificationServices");

const { isEqual } = require("lodash");

exports.followingOtherUser = (followingId, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!followingId) {
        reject(new AppError(`You haven't chosen who you want to follow`, 400));
      } else if (id === followingId) {
        reject(new AppError(`Bad request`, 400));
      } else {
        let check = await isFollowing(id, followingId);
        if (check) {
          reject(new AppError(`You already follow this user`, 400));
        } else {
          await FollowModel.create({
            follower: id,
            following: followingId,
          });
          const profile = await ProfileModel.findOne({ user: id }).select(
            "firstname lastname username"
          );

          await feedServices.addFollowingUserPostToFeed(id, followingId);

          const _ = await notiServices.createFollowNotification(
            id,
            followingId
          );
          console.log(_);
          resolve({
            status: "Success",
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
const isFollowing = async (idFollower, followingId) => {
  const isFollowing = await FollowModel.findOne({
    follower: idFollower,
    following: followingId,
  });
  if (isFollowing) {
    return true;
  } else {
    return false;
  }
};
exports.getAllFollowings = (id, myId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        const following = await FollowModel.find({ follower: id })
          .populate({
            path: "following",
            model: "User",
            select: "profile",
          })
          .select("following");
        const data = await Promise.all(
          following.map(async (following) => {
            if (following && following.following && following.following._id) {
              const status = await isFollowing(myId, following.following._id);
              return { ...following.toObject(), status };
            } else {
              return null;
            }
          })
        );
        const filteredData = data.filter((item) => item !== null);
        resolve({
          status: "Success",
          data: filteredData,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

exports.getAllFollowers = (id, myId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        const follower = await FollowModel.find({ following: id })
          .populate({
            path: "follower",
            model: "User",
            select: "profile",
          })
          .select("follower");
        const data = await Promise.all(
          follower.map(async (follower) => {
            if (follower && follower.follower && follower.follower._id) {
              const status = await isFollowing(myId, follower.follower._id);
              return { ...follower.toObject(), status };
            } else {
              return null;
            }
          })
        );
        const filteredData = data.filter((item) => item !== null);
        resolve({
          status: "Success",
          data: filteredData,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

exports.getMyFollowingList = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        const data = await FollowModel.find({ follower: id })
          .populate({
            path: "following",
            model: "User",
            select: "profile",
          })
          .select("following");
        const filteredData = data.filter((item) => item && item.following);

        resolve({
          status: "Success",
          data: filteredData,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

exports.getMyFollowerList = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        const follower = await FollowModel.find({ following: id })
          .populate({
            path: "follower",
            model: "User",
            select: "profile",
          })
          .select("follower");
        const data = await Promise.all(
          follower.map(async (follower) => {
            if (follower && follower.follower && follower.follower._id) {
              const status = await isFollowing(id, follower.follower._id);
              return { ...follower.toObject(), status };
            } else {
              return null;
            }
          })
        );
        const filteredData = data.filter((item) => item !== null);
        resolve({
          status: "Success",
          data: filteredData,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

exports.unfollow = (id, followingId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!followingId) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        let check = await isFollowing(id, followingId);
        if (!check) {
          // reject(new AppError(`You don't follow this person yet`, 400));
          resolve({
            message: `You don't follow this person`,
          });
        } else {
          await FollowModel.deleteOne({ follower: id, following: followingId });
          await feedServices.removeUnfollowedUserPostFromFeed(id, followingId);
          resolve({
            status: "Success",
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
exports.getNumberOfFollows = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        const NumberOfFollowing = await FollowModel.countDocuments({
          follower: id,
        });
        const NumberOfFollower = await FollowModel.countDocuments({
          following: id,
        });
        resolve({
          status: "Success",
          data: {
            NumberOfFollower: NumberOfFollower,
            NumberOfFollowing: NumberOfFollowing,
          },
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

exports.isFollowing = (idFollower, followingId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!followingId) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        const check = await isFollowing(idFollower, followingId);
        resolve({
          status: "Success",
          data: check,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const getGeneralFollowingCount = async (userId, otherId) => {
  const listA = await FollowModel.find({ follower: userId });
  const listB = await FollowModel.find({ follower: otherId });
  const followingListA = listA.map((item) => item.following.toString());
  const followingListB = listB.map((item) => item.following.toString());
  const commonFollowings = followingListA.filter((value) =>
    followingListB.includes(value)
  );
  return commonFollowings;
};
const suggestSimilarInterests = async (userId, otherId) => {
  const preferenceListA = await UserPreferenceModel.distinct("category", {
    user: userId,
  });
  if (preferenceListA.length === 0) {
    return false;
  }
  const preferenceListB = await UserPreferenceModel.distinct("category", {
    user: otherId,
  });

  const equal = isEqual(preferenceListA.sort(), preferenceListB.sort());
  return equal;
};
exports.suggestFollow = async (userId) => {
  try {
    const users = await User.find({ role: "user" })
      .populate({
        path: "profile",
        model: "Profile",
        select: "avatar firstname lastname -user slug",
      })
      .select("profile");

    const promises = users.map(async (user) => {
      if (user.profile) {
        const check = await isFollowing(userId, user._id);
        if (!check && userId !== user._id.toString()) {
          const checkPreference = await suggestSimilarInterests(
            userId,
            user._id
          );
          if (checkPreference) {
            return { user };
          } else {
            const count = await getGeneralFollowingCount(userId, user._id);
            if (count.length > 0) {
              return { user, count: count.length };
            }
          }
        }
      }
    });

    const results = await Promise.all(promises);
    const listSuggest = results.filter(Boolean);
    listSuggest.sort((a, b) => b.count - a.count);
    const top10Suggest = listSuggest.slice(0, 6);

    return {
      status: "Success",
      data: top10Suggest,
    };
  } catch (error) {
    throw error;
  }
};

exports.getFriends = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        reject(new AppError(`Missing parameter`, 400));
      } else {
        let friendIds = [];
        const followings = await FollowModel.find({ follower: id }).lean();
        const followers = await FollowModel.find({ following: id }).lean();
        followings.map((following) =>
          followers.map((follower) => {
            if (following.following.toString() === follower.follower.toString())
              friendIds.push(following.following);
          })
        );
        const friends = await ProfileModel.find({ user: { $in: friendIds } });
        resolve({ status: "Success", data: friends });
      }
    } catch (error) {
      reject(error);
    }
  });
};

const ProfileModel = require("./../models/profileModel");
const UserModel = require("./../models/userModel");
const PostModel = require("./../models/postModel");
const AppError = require("./../utils/appError");

const crypto = require("crypto");

exports.getProfileByID = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                reject(new AppError(`Missing parameter`, 400));
            } else {
                let profile = await ProfileModel.findOne({ user: id });
                if (!profile) {
                    reject(new AppError(`User not found`, 400));
                } else {
                    resolve({
                        status: "Success",
                        data: profile,
                    });
                }
            }
            console.log(profile);
        } catch (error) {
            reject(error);
        }
    });
};
exports.checkMyId = (myId, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                reject(new AppError(`Missing parameter`, 400));
            } else {
                let check;
                if (myId === id) {
                    check = true;
                } else {
                    check = false;
                }
                resolve({
                    data: check,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
exports.updateMe = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (
                !id ||
                !data.firstname === undefined ||
                data.lastname === undefined ||
                data.gender === undefined
            ) {
                reject(new AppError(`Missing parameter`, 400));
            } else {
                await ProfileModel.findOneAndUpdate(
                    { user: id },
                    {
                        firstname: data.firstname,
                        lastname: data.lastname,
                        avatar: data.avatar,
                        birthday: data.birthday,
                        bio: data.bio,
                        address: data.address,
                        background: data.background,
                        gender: data.gender,
                        slug: data.slug,
                    },
                    {
                        runValidators: true,
                        context: "query",
                    }
                );
                resolve({
                    status: "Success",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

exports.lockOrUnlockAccount = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                reject(new AppError(`Missing parameter`, 400));
            } else {
                let account = await UserModel.findById(id);
                if (account) {
                    const updatedIsActived =
                        account.isActived !== undefined
                            ? !account.isActived
                            : false;
                    await UserModel.findByIdAndUpdate(id, {
                        isActived: updatedIsActived,
                    });
                }

                resolve({
                    status: "Success",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

exports.getOverview = (year) => {
    return new Promise(async (resolve, reject) => {
        try {
            const countOfUser = await UserModel.countDocuments();
            const accounts = await UserModel.aggregate([
                {
                    $project: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                },
                {
                    $match: {
                        year: Number(year),
                        // role: { $in: ['user', 'business'] }
                    },
                },
                {
                    $group: {
                        _id: {
                            month: "$month",
                            year: "$year",
                        },
                        userCount: { $sum: 1 },
                    },
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                    },
                },
            ]);
            const countOfPosts = await PostModel.countDocuments();
            const posts = await PostModel.aggregate([
                {
                    $project: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                },
                {
                    $match: {
                        year: Number(year),
                    },
                },
                {
                    $group: {
                        _id: {
                            month: "$month",
                            year: "$year",
                        },
                        postCount: { $sum: 1 },
                    },
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,
                    },
                },
            ]);
            resolve({
                status: "Success",
                account: accounts,
                numOfAccount: countOfUser,
                post: posts,
                numOfPost: countOfPosts,
            });
        } catch (error) {
            reject(error);
        }
    });
};

exports.getUserPreferences = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!userId) {
                return reject(new AppError("Please enter user id", 400));
            }

            const user = await UserModel.findById(userId);
            if (!user) {
                return reject(new AppError("User not found", 400));
            }

            return resolve(user.preferences);
        } catch (err) {
            return reject(err);
        }
    });
};

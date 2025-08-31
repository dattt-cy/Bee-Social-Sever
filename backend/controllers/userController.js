const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const userServices = require("../services/userServices");
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getUser = factory.getOne(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.updateUser = factory.updateOne(User);

exports.getProfileByID = catchAsync(async (req, res, next) => {
    const data = await userServices.getProfileByID(req.params.id);
    return res.status(200).json(data);
});

exports.getMe = catchAsync(async (req, res, next) => {
    const data = await userServices.getProfileByID(req.user.id);
    return res.status(200).json(data);
});
exports.checkMyId = catchAsync(async (req, res, next) => {
    const data = await userServices.checkMyId(req.user.id, req.params.id);
    return res.status(200).json(data);
});

exports.updateMe = catchAsync(async (req, res, next) => {
    const data = await userServices.updateMe(req.user.id, req.body);
    return res.status(200).json(data);
});

exports.lockOrUnlockAccount = catchAsync(async (req, res, next) => {
    const data = await userServices.lockOrUnlockAccount(req.params.id);
    return res.status(200).json(data);
});
exports.getOverview = catchAsync(async (req, res, next) => {
    const data = await userServices.getOverview(req.params.year);
    return res.status(200).json(data);
});

exports.getAllUsers = factory.getAll(User);
exports.createUser = factory.createOne(User);
exports.deleteUser = factory.deleteOne(User);

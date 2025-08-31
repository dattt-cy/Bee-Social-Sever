const UserModel = require("./../models/userModel");
const ProfileModel = require("./../models/profileModel");
const BusinessRequest = require("./../models/businessRequestModel");
const AppError = require("./../utils/appError");
const crypto = require("crypto");

const { sendEmail } = require("./../utils/sendEmail");
const sendResetPwEmail = require("../utils/sendResetPwEmail");

exports.signup = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (
                !data.email ||
                !data.password ||
                !data.passwordConfirm ||
                !data.firstname ||
                !data.lastname ||
                !data.slug ||
                data.gender === undefined
            ) {
                reject(new AppError("Please fill in all required fields", 400));
            } else if (data.password !== data.passwordConfirm) {
                reject(new AppError("Password confirmation is incorrect", 400));
            } else {
                const verifyToken = crypto.randomBytes(32).toString("hex");
                const user = await UserModel.create({
                    phonenumber: data.phonenumber,
                    email: data.email,
                    password: data.password,
                    passwordConfirm: data.passwordConfirm,
                    role: data.role,
                    verifyToken: verifyToken,
                    preferences: data.preferences,
                });
                const profile = await ProfileModel.create({
                    firstname: data.firstname,
                    lastname: data.lastname,
                    gender: data.gender,
                    avatar: data.avatar,
                    address: data.address,
                    bio: data.bio,
                    birthday: data.birthday,
                    user: user.id,
                    slug: data.slug,
                });
                const url = `${process.env.CLIENT_URL}/verify/${user._id}/${verifyToken}`;
                await sendEmail(user.email, "Email Verification", url);
                resolve(profile);
            }
        } catch (error) {
            reject(error);
        }
    });
};

exports.login = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { email, password } = data;
            if (!email || !password) {
                reject(new AppError("Please provide email and password!", 400));
            }
            // 2) Check if user exists && password is correct
            const user = await UserModel.findOne({ email })
                .select("+password")
                .populate("profile");

            if (
                !user ||
                !(await user.correctPassword(password, user.password))
            ) {
                reject(new AppError("Incorrect email or password", 401));
            }
            if (user.isActived === false) {
                reject(
                    new AppError(
                        "Your account has been locked. Please contact us for help",
                        401
                    )
                );
            }
            if (!user.verify) {
                if (!user.verifyToken) {
                    const verifyToken = crypto.randomBytes(32).toString("hex");
                    await UserModel.findByIdAndUpdate(user._id, {
                        verifyToken: verifyToken,
                    });
                    const url = `${process.env.CLIENT_URL}/verify/${user._id}/${verifyToken}`;
                    await sendEmail(user.email, "Email Verification", url);
                }
                reject(
                    new AppError(
                        "An Email sent to your account! Please verify",
                        401
                    )
                );
            }

            if (user.role === "business" && user.approved === false) {
                return reject(
                    new AppError(
                        `Your business profile has not been approved yet. Please check your email`,
                        401
                    )
                );
            }
            resolve(user);
        } catch (error) {
            reject(error);
        }
    });
};

exports.verifyToken = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await UserModel.findOne({ _id: userId });
            if (!user) reject(new AppError("User not found", 404));
            if (!user.verifyToken) reject(new AppError("Token not found", 404));

            const currentUser = await UserModel.findByIdAndUpdate(user._id, {
                verify: true,
                verifyToken: null,
            });
            resolve(currentUser);
        } catch (error) {
            reject(error);
        }
    });
};

let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await UserModel.findOne({
                where: { email: userEmail },
            });
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (e) {
            reject(e);
        }
    });
};

exports.businessSignUp = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(data);
            if (
                !data.email ||
                !data.password ||
                !data.passwordConfirm ||
                !data.firstname ||
                !data.lastname ||
                !data.slug ||
                data.gender === undefined
            ) {
                reject(new AppError("Please fill in all required fields", 400));
            } else if (data.password !== data.passwordConfirm) {
                reject(new AppError("Password confirmation is incorrect", 400));
            } else {
                const verifyToken = crypto.randomBytes(32).toString("hex");
                const user = await UserModel.create({
                    phonenumber: data.phonenumber,
                    email: data.email,
                    password: data.password,
                    passwordConfirm: data.passwordConfirm,
                    role: "business",
                    verifyToken: verifyToken,
                    preferences: data.preferences,
                });
                const profile = await ProfileModel.create({
                    firstname: data.firstname,
                    lastname: data.lastname,
                    gender: data.gender,
                    avatar: data.avatar,
                    address: data.address,
                    bio: data.bio,
                    birthday: data.birthday,
                    user: user.id,
                    slug: data.slug,
                });

                const businessRequest = await BusinessRequest.create({
                    user: user.id,
                });
                if (!businessRequest) {
                    reject(new AppError(`An error occurs`, 500));
                }
                const url = `${process.env.CLIENT_URL}/verify/${user._id}/${verifyToken}`;
                await sendEmail(user.email, "Email Verification", url);
                resolve(profile);
            }
        } catch (err) {
            reject(err);
        }
    });
};

exports.resetPassword = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!email) {
                reject(new AppError(`Missing parameter`, 400));
            } else {
                let user = await UserModel.findOne({ email: email });
                if (user) {
                    const LENGTH = 12;
                    const CHARACTERS =
                        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$";
                    // console.log(generatedPassword);
                    const generatedPassword = Array.from(
                        crypto.randomFillSync(new Uint32Array(LENGTH))
                    )
                        .map((x) => CHARACTERS[x % CHARACTERS.length])
                        .join("");
                    user.password = generatedPassword;
                    user.passwordConfirm = generatedPassword;
                    user.save();

                    await sendResetPwEmail(
                        email,
                        "Password Reset",
                        generatedPassword
                    );

                    resolve({
                        status: "Success",
                    });
                } else {
                    reject(
                        new AppError("This email has not been registered", 401)
                    );
                }
            }
        } catch (error) {
            reject(error);
        }
    });
};

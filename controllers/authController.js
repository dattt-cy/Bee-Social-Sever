const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const authService = require("./../services/authServices");

const createAccessToken = (user, res, expiresTime = "10000s") => {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: expiresTime,
    });
    const cookieOptions = {
        expires: new Date(Date.now() + 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
        sameSite: "none",
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    if (process.env.NODE_ENV === "development")
        res.cookie("jwt", token, cookieOptions);
    return token;
};

const createRefreshToken = async (user, res) => {
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: "10d",
        }
    );
    await User.findByIdAndUpdate(user._id, {
        refreshToken: refreshToken,
    });
    const cookieOptionsRefresh = {
        expires: new Date(
            Date.now() +
                process.env.JWT_COOKIE_REFRESH_TOKEN_EXPIRES_IN *
                    24 *
                    60 *
                    60 *
                    1000
        ),
        httpOnly: true,
        secure: false,
        sameSite: "none",
    };
    if (process.env.NODE_ENV === "production")
        cookieOptionsRefresh.sameSite = "none";
    if (process.env.NODE_ENV === "production")
        cookieOptionsRefresh.secure = true;
    res.cookie("refresh", refreshToken, cookieOptionsRefresh);
};

const createSendToken = async (
    user,
    statusCode,
    res,
    expiresTime = "10000s"
) => {
    const token = createAccessToken(user, res, expiresTime);
    await createRefreshToken(user, res);
    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

exports.refreshToken = catchAsync(async (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.refresh)
        return next(
            new AppError(
                "You are not logged in! Please log in to get access.",
                401
            )
        );
    const refreshToken = cookies.refresh;
    const user = await User.find({ refreshToken: refreshToken });
    if (!user) return next(new AppError("Forbidden", 403));
    const decoded = await promisify(jwt.verify)(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
    );
    const currentUser = await User.findById(decoded.id).populate("profile");

    if (!currentUser) {
        return next(
            new AppError(
                "The user belonging to this token does no longer exist.",
                403
            )
        );
    }
    const token = createAccessToken(currentUser, res);

    res.status(200).json({
        status: "success",
        token,
        data: {
            user: currentUser,
        },
    });
});

// exports.signup = catchAsync(async (req, res, next) => {
//   const newUser = await User.create({
//     name: req.body.name,
//     email: req.body.email,
//     phonenumber: req.body.phonenumber,
//     password: req.body.password,
//     passwordConfirm: req.body.passwordConfirm,
//     role: req.body.role,
//   });

//   await createSendToken(newUser, 201, res);
// });

exports.verifyEmail = catchAsync(async (req, res, next) => {
    // console.log(req.params.id);
    await authService.verifyToken(req.params.id);
    res.status(200).json({
        status: "success",
        message: "Your account has been verified.",
    });
});

exports.signup1 = catchAsync(async (req, res) => {
    const profile = await authService.signup(req.body);
    res.status(201).json({
        status: "success",
        data: {
            profile,
        },
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await authService.login({ email, password });
    await createSendToken(user, 200, res);
});

exports.mobileLogin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await authService.login({ email, password });
    await createSendToken(user, 200, res, "10d");
});

exports.logout = (req, res) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    // console.log(token);
    if (!token) {
        return next(
            new AppError(
                "You are not logged in! Please log in to get access.",
                401
            )
        );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    if (!decoded) {
        return next(
            new AppError(
                "You are not logged in! Please log in to get access.",
                401
            )
        );
    }
    // console.log(decoded);
    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    // console.log(currentUser);
    if (!currentUser) {
        return next(
            new AppError(
                "The user belonging to this token does no longer exist.",
                401
            )
        );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                "User recently changed password! Please log in again.",
                401
            )
        );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    "You do not have permission to perform this action",
                    403
                )
            );
        }

        next();
    };
};

// exports.forgotPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on POSTed email
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(new AppError('There is no user with email address.', 404));
//   }

//   // 2) Generate the random reset token
//   const resetToken = user.createPasswordResetToken();
//   await user.save({ validateBeforeSave: false });

//   // 3) Send it to user's email
//   const resetURL = `${req.protocol}://${req.get(
//     'host'
//   )}/api/v1/users/resetPassword/${resetToken}`;

//   const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: 'Your password reset token (valid for 10 min)',
//       message
//     });

//     res.status(200).json({
//       status: 'success',
//       message: 'Token sent to email!'
//     });
//   } catch (err) {
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save({ validateBeforeSave: false });

//     return next(
//       new AppError('There was an error sending the email. Try again later!'),
//       500
//     );
//   }
// });

exports.resetPassword = catchAsync(async (req, res, next) => {
    await authService.resetPassword(req.body.email);
    res.status(200).json({
        status: "success",
        message: "Your password has been reset.",
    });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");

    // 2) Check if POSTed current password is correct
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError("Your current password is wrong.", 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});

// exports.businessSignup = catchAsync(async (req, res) => {
//   const profile = await authService.businessSignUp(req.body);
//   res.status(201).json({
//     status: "success",
//     data: {
//       profile,
//     },
//     message:
//       "An email has been sent to your email address. Please verify your email address to continue to next steps",
//   });
// });

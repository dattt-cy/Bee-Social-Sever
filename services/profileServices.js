const Profile = require("./../models/profileModel");
const APIFeatures = require("./../utils/apiFeatures");
const AppError = require("./../utils/appError");

exports.searchUser = (searchText, query) => {
    return new Promise(async (resolve, reject) => {
        if (!searchText) {
            reject(new AppError(`Empty search text`, 400));
        }
        try {
            const regex = new RegExp(searchText, "i");
            const features = new APIFeatures(
                Profile.find({
                    $or: [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: {
                                        $concat: [
                                            { $ifNull: ["$firstname", ""] }, // Handle potential null values
                                            " ",
                                            { $ifNull: ["$lastname", ""] },
                                        ],
                                    },
                                    regex: regex.source,
                                    options: "i",
                                },
                            },
                        },
                        { bio: { $regex: regex } },
                        { slug: { $regex: regex } },
                    ],
                }),
                query
            )
                .sort()
                .paginate();

            const profiles = await features.query;
            resolve({
                status: "success",
                results: profiles.length,
                data: profiles,
            });
        } catch (error) {
            reject(error);
        }
    });
};

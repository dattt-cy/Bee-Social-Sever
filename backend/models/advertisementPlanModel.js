const mongoose = require("mongoose");

const AdvertisementPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "An advertisement plan must have a specific name"],
    },
    duration: {
        type: Number,
        default: 0,
        validate: {
            validator: function (value) {
                return value >= 0;
            },
            message: () => `Duration must be greater or equal to 0`,
        },
    },
    price: {
        type: Number,
        default: 0,
        validate: {
            validator: function (value) {
                return value >= 0;
            },
            message: () => `Price must be greater or equal to 0`,
        },
    },
    type: {
        type: String,
        required: [true, "An advertisement plan must have type"],
        enum: ["day", "month", "year"],
        default: "day",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const AdvertisementPlanModel = mongoose.model(
    "AdvertisementPlan",
    AdvertisementPlanSchema
);

module.exports = AdvertisementPlanModel;

const mongoose = require("mongoose");

const Profileschema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      maxLength: 20,
      minLength: 2,
      trim: true,
      required: [true, "Please tell us your first name!"],
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9_\p{L}]+$/u.test(value);
        },
        message: "Firstname only contains characters and numbers",
      },
    },
    lastname: {
      type: String,
      maxLength: 20,
      minLength: 2,
      trim: true,
      required: [true, "Please tell us your last name!"],
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9_\p{L}]+$/u.test(value);
        },
        message: "Lastname only contains characters, numbers and underscore",
      },
    },
    slug: {
      type: String,
      required: [true, "Please tell us your slug!"],
      maxLength: 30,
      minLength: 4,
      trim: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9_]+$/.test(value);
        },
        message: "A slug only contains characters, numbers and underscore",
      },
    },
    gender: {
      type: Boolean,
      required: [true, "Please tell us your gender"],
    },
    avatar: String,
    background: String,
    address: String,
    bio: String,
    birthday: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

Profileschema.index({ user: 1 }, { unique: true });
Profileschema.post("save", async function () {
  await this.populate("user");
});

const ProfileModel = mongoose.model("Profile", Profileschema);

module.exports = ProfileModel;

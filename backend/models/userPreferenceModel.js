const mongoose = require("mongoose");

const UserPreferenceschema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: [true, 'A user preference must have a user'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Reference to the Category model
    required: [true, 'A user preference must have a category'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserPreferenceModel = mongoose.model(
  'UserPreference',
  UserPreferenceschema,
);

module.exports = UserPreferenceModel;
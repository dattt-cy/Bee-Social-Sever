const mongoose = require("mongoose");

const SharePostschema = new mongoose.Schema({
  sharer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post', // Reference to the Post model
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const SharePostModel = mongoose.model('SharePost', SharePostschema);

module.exports = SharePostModel;

const mongoose = require("mongoose");

const HashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a Hashtag name"],
    unique: true,
  },
});

const HashtagModel = mongoose.model("Hashtag", HashtagSchema);

module.exports = HashtagModel;

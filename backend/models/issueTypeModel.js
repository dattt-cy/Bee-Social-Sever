const mongoose = require("mongoose");

const IssueTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Issue type must be declared"],
    unique: [true, "Issue type must be unique"],
  },
});

const IssueTypeModel = mongoose.model("IssueType", IssueTypeSchema);

module.exports = IssueTypeModel;

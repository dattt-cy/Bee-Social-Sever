const factory = require("./handlerFactory");
const IssueType = require("./../models/issueTypeModel");

exports.getAllIssues = factory.getAll(IssueType);
exports.createIssue = factory.createOne(IssueType);

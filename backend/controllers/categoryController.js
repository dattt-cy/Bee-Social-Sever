const factory = require("./handlerFactory");
const Category = require("./../models/categoryModel");

exports.getAllCategories = factory.getAll(Category);

exports.getCategory = factory.getOne(Category);

exports.createCategory = factory.createOne(Category);

exports.deleteCategory = factory.deleteOne(Category);

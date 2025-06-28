const catchAsync = require("./../utils/catchAsync");
const handlerFactoryServices = require("../services/handlerFactoryServices");

exports.deleteOne = (Model) =>
    catchAsync(async (req, res) => {
        const doc = await handlerFactoryServices.deleteOne(
            Model,
            req.params.id
        );

        res.status(204).json({
            status: "success",
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res) => {
        const doc = await handlerFactoryServices.updateOne(
            Model,
            req.params.id,
            req.body
        );

        res.status(200).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res) => {
        const doc = await handlerFactoryServices.createOne(Model, req.body);

        res.status(201).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res) => {
        const doc = await handlerFactoryServices.getOne(
            Model,
            req.params.id,
            popOptions
        );

        res.status(200).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });
exports.getAll = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        const doc = await handlerFactoryServices.getAll(
            Model,
            req.query,
            popOptions
        );
        const total = await Model.countDocuments();
        // SEND RESPONSE
        res.status(200).json({
            status: "success",
            results: doc.length,
            total,
            data: {
                data: doc,
            },
        });
    });

const catchAsync = require("./../utils/catchAsync");
const unitPriceServices = require("./../services/unitPriceServices");

exports.createUnitPrice = catchAsync(async (req, res, next) => {
    const data = await unitPriceServices.createUnitPrice(req.body);
    res.status(201).json(data);
});

exports.updateUnitPrice = catchAsync(async (req, res, next) => {
    const data = await unitPriceServices.updateUnitPrice(
        req.params.id,
        req.body.price
    );
    res.status(200).json(data);
});

exports.getAll = catchAsync(async (req, res, next) => {
    const data = await unitPriceServices.getAll();
    res.status(200).json(data);
});

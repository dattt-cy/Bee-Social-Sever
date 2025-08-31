const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

exports.deleteOne = (Model, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = await Model.findByIdAndDelete(id);

            if (!doc) {
                reject(new AppError("No document found with that ID", 404));
            }
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
};

exports.updateOne = (Model, id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = await Model.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true,
            });

            if (!doc) {
                reject(new AppError("No document found with that ID", 404));
            }
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
};

exports.createOne = (Model, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = await Model.create(data);
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
};

exports.getOne = (Model, id, popOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = Model.findById(id);
            if (popOptions) query = query.populate(popOptions);
            const doc = await query;

            if (!doc) {
                reject(new AppError("No document found with that ID", 404));
            }
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
};

exports.getAll = (Model, query, popOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            const features = new APIFeatures(Model.find(), query)
                .filter()
                .sort()
                .limitFields()
                .paginate();
            // const doc = await features.query.explain();
            if (popOptions)
                features.query = features.query.populate(popOptions);
            const doc = await features.query;
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
};

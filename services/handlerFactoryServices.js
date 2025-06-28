const AppError = require("./../utils/appError");

exports.deleteOne = (Model, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = await Model.findByIdAndDelete(id);

            if (!doc) {
                return reject(
                    new AppError("No document found with that ID", 404)
                );
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
                return reject(
                    new AppError("No document found with that ID", 404)
                );
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
                return reject(
                    new AppError("No document found with that ID", 404)
                );
            }
            resolve(doc);
        } catch (error) {
            reject(error);
        }
    });
};

exports.getAll = (Model, filter = {}, popOptions) => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = Model.find(filter);
            if (popOptions) query = query.populate(popOptions);
            const docs = await query;
            resolve(docs);
        } catch (error) {
            reject(error);
        }
    });
};

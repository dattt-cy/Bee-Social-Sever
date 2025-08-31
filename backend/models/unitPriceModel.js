const mongoose = require("mongoose");

const UnitPriceSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: [true, "Price must have schema"],
  },

  type: {
    type: String,
    enum: ["day", "month"],
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const UnitPriceModel = mongoose.model("UnitPrice", UnitPriceSchema);

module.exports = UnitPriceModel;

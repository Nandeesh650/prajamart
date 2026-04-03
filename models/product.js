const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
  },

  key: [{
    type: String,
    required: true,
    trim: true,
  }],

  discount: {
    type: Number,
    default: 0,
  },

  location: {
    type: String,
    trim: true,
    default: "",
  },

  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  availableSizes: [{
    type: String,
    enum: [
      "S", "M", "L", "XL", "XXL",
      "1", "2", "3", "4", "5",
      "6", "7", "8", "9", "10"
    ]
  }],

  stock: {
    type: Number,
    default: 0,
  },

  photo: String,
  description: String,
});

module.exports = mongoose.model("Product", productSchema);

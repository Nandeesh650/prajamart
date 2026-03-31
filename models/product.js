const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  rating: {
    stars: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  photo: String,
  description: String,
});

// productSchema.pre('findOneAndDelete', async function(next) {
//   console.log('Came to pre hook while deleting a product');
//   const productId = this.getQuery()._id;
//   await favourite.deleteMany({houseId: productId});
//   next();
// });

module.exports = mongoose.model("Product", productSchema);

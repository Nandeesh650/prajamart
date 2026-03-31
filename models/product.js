const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  houseName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
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

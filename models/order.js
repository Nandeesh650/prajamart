const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  userRating: {
    stars: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    comment: String
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: Date,
  shippingAddress: String,
  notes: String,
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'debit_card'],
    default: 'cod',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  upiId: String,
  cardDetails: {
    cardNumber: String,
    cardHolder: String,
    expiryDate: String
  }
});

module.exports = mongoose.model("Order", orderSchema);

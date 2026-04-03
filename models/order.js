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
  size: {
    type: String,
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
    enum: ['pending', 'confirmed', 'ready_to_deliver', 'out_for_delivery', 'shipped', 'delivered', 'return_requested', 'returned', 'cancelled'],
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
  returnRequestedAt: Date,
  returnedAt: Date,
  deliveryLocation: {
    label: String,
    addressDetails: String,
    placeName: String,
    formattedAddress: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryAcceptedAt: Date,
  deliveryOtp: String,
  deliveryOtpGeneratedAt: Date,
  deliveryOtpVerifiedAt: Date,
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

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: String,
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ""
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  userType: {
    type: String,
    enum: ['guest', 'host', 'deliveryboy'],
    default: 'guest'
  },
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
});

module.exports = mongoose.model('User', userSchema);

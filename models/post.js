const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Post description is required']
  },
  productLink: {
    type: String,
    required: [true, 'Product link is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Post image is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);

const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema); 
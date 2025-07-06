const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNo: {
    type: String,
    // required: true,
    trim: true
  },
  chassisNo: {
    type: String,
    // required: true,
    trim: true
  },
  engineNo: {
    type: String,
    // required: true,
    trim: true
  },
  agNo: {
    type: String,
    // required: true,
    trim: true
  },
  branch: {
    type: String,
    // required: true,
    trim: true
  },
  customerName: {
    type: String,
    // required: true,
    trim: true
  },
  bkt: {
    type: String,
    // required: true,
    trim: true
  },
  area: {
    type: String,
    // required: true,
    trim: true
  },
  vehicleMaker: {
    type: String,
    // required: true,
    trim: true
  },
  lpp: {
    type: String,
    // required: true,
    trim: true
  },
  bcc: {
    type: String,
    // required: true,
    trim: true
  },
  companyName: {
    type: String,
    // required: true,
    trim: true
  },
  companyBranch: {
    type: String,
    // required: true,
    trim: true
  },
  companyContact: {
    type: String,
    // required: true,
    trim: true
  },
  companyContactPerson: {
    type: String,
    // required: true,
    trim: true
  },
  agencyName: {
    type: String,
    // required: true,
    trim: true
  },
  agencyContact: {
    type: String,
    // required: true,
    trim: true
  },
  group: {
    type: String,
    default: '',
    trim: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
vehicleSchema.index({ vehicleNo: 1 });
vehicleSchema.index({ chassisNo: 1 });
vehicleSchema.index({ engineNo: 1 });
vehicleSchema.index({ customerName: 1 });
vehicleSchema.index({ companyName: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema); 
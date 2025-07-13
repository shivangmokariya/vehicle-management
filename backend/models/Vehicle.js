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
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  state: { type: String, trim: true },
  city: { type: String, trim: true },
  fileNo: { type: String, trim: true },
  loanAgreementNo: { type: String, trim: true },
  nameOfClient: { type: String, trim: true },
  vehicleType: { type: String, trim: true },
  make: { type: String, trim: true },
  model: { type: String, trim: true },
  year: { type: String, trim: true },
  regNo: { type: String, trim: true },
  month: { type: String, trim: true },
  emi: { type: String, trim: true },
  pos: { type: String, trim: true },
  tos: { type: String, trim: true },
  fcAmt: { type: String, trim: true },
  loanAmount: { type: String, trim: true },
  dpd: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  customerMobileNumber: { type: String, trim: true },
  groupAccountCount: { type: String, trim: true },
  contactPerson1: { type: String, trim: true },
  mobileNumber1: { type: String, trim: true },
  contactPerson2: { type: String, trim: true },
  mobileNumber2: { type: String, trim: true },
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
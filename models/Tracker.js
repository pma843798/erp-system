const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  role: String,
  changedAt: {
    type: Date,
    default: Date.now
  },
});

const trackerSchema = new mongoose.Schema({
  
  // BASIC DETAILS
  catNo: String,
  styleNo: {
    type: String,
    required: true
  },

  // DATE FIELDS & RED FIELD STATUSES
  factoryFOB: Date,
  vendorPhotoShootDate: Date,

  labdipQualityDeskloomDue: Date,
  labdipPlannedDate: Date,
  labdipPlannedStatus: { type: String, default: "Pending" },
  // NEW: approval fields for Labdip
  labdipApprovedDate: Date,
  labdipApprovedBy: String,

  photoSampleDue: Date,
  photoSamplePlannedDate: Date,
  photoSamplePlannedStatus: { type: String, default: "Pending" },
  // NEW: approval fields for Photo Sample
  photoSampleApprovedDate: Date,
  photoSampleApprovedBy: String,

  testReportDue: Date,

  plannedFPT: Date,
  plannedFPTStatus: { type: String, default: "Pending" },
  // NEW: approval fields for FPT
  plannedFPTApprovedDate: Date,
  plannedFPTApprovedBy: String,

  plannedGPT: Date,
  plannedGPTStatus: { type: String, default: "Pending" },
  // NEW: approval fields for GPT
  plannedGPTApprovedDate: Date,
  plannedGPTApprovedBy: String,

  gsmColorLotsDue: Date,
  gsmColorLotsPlanned: Date,
  gsmColorLotsPlannedStatus: { type: String, default: "Pending" },
  // NEW: approval fields for GSM/Color
  gsmColorLotsApprovedDate: Date,
  gsmColorLotsApprovedBy: String,

  remark: String,

  history: [historySchema],

}, {
  timestamps: true,
  strict: false   // Allows dynamic custom columns
});

module.exports = mongoose.model('Tracker', trackerSchema);
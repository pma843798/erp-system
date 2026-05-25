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
  
  // ======================================================
  // BASIC DETAILS
  // ======================================================

  catNo: String,

  styleNo: {
    type: String,
    required: true
  },

  // ======================================================
  // DATE FIELDS & RED FIELD STATUSES
  // ======================================================

  factoryFOB: Date,

  vendorPhotoShootDate: Date,

  labdipQualityDeskloomDue: Date,

  labdipPlannedDate: Date,
  labdipPlannedStatus: {
    type: String,
    default: "Pending"
  },

  photoSampleDue: Date,

  photoSamplePlannedDate: Date,
  photoSamplePlannedStatus: {
    type: String,
    default: "Pending"
  },

  testReportDue: Date,

  plannedFPT: Date,
  plannedFPTStatus: {
    type: String,
    default: "Pending"
  },

  plannedGPT: Date,
  plannedGPTStatus: {
    type: String,
    default: "Pending"
  },

  gsmColorLotsDue: Date,

  gsmColorLotsPlanned: Date,
  gsmColorLotsPlannedStatus: {
    type: String,
    default: "Pending"
  },

  // ======================================================
  // REMARK
  // ======================================================

  remark: String,

  // ======================================================
  // HISTORY
  // ======================================================

  history: [historySchema],

}, {

  timestamps: true,

  // 🔥 Dynamic columns allow karega
  strict: false
});

module.exports = mongoose.model('Tracker', trackerSchema);
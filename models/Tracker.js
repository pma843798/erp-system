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

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: String,
  changedAt: { type: Date, default: Date.now },
});

const trackerSchema = new mongoose.Schema({
  catNo: String,
  styleNo: { type: String, required: true },

  factoryFOB: Date,
  vendorPhotoShootDate: Date,

  labdipQualityDeskloomDue: Date,
  labdipPlannedDate: Date,
  labdipPlannedStatus: { type: String, default: "Pending" },
  labdipApprovedDate: Date,
  labdipApprovedBy: String,

  // ✅ NEW
  fabInHousePlannedDate: Date,

  photoSampleDue: Date,
  photoSamplePlannedDate: Date,
  photoSamplePlannedStatus: { type: String, default: "Pending" },
  photoSampleApprovedDate: Date,
  photoSampleApprovedBy: String,

  // ✅ NEW
  fptDueDate: Date,
  gptDueDate: Date,

  plannedFPT: Date,
  plannedFPTStatus: { type: String, default: "Pending" },
  plannedFPTApprovedDate: Date,
  plannedFPTApprovedBy: String,

  plannedGPT: Date,
  plannedGPTStatus: { type: String, default: "Pending" },
  plannedGPTApprovedDate: Date,
  plannedGPTApprovedBy: String,

  gsmColorLotsDue: Date,
  gsmColorLotsPlanned: Date,
  gsmColorLotsPlannedStatus: { type: String, default: "Pending" },
  gsmColorLotsApprovedDate: Date,
  gsmColorLotsApprovedBy: String,

  remark: String,
  history: [historySchema],
}, {
  timestamps: true,
  strict: false   // waise bhi hai, safe
});

module.exports = mongoose.model('Tracker', trackerSchema);

module.exports = mongoose.model('Tracker', trackerSchema);
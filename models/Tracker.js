const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: String,
  changedAt: { type: Date, default: Date.now },
});

const trackerSchema = new mongoose.Schema(
  {
    catNo: String,
    styleNo: { type: String, required: true },
    styleName: String,                     // ✅ NEW

    factoryFOB: Date,
    vendorPhotoShootDate: Date,

    labdipQualityDeskloomDue: Date,
    labdipPlannedDate: Date,
    labdipPlannedStatus: { type: String, default: "Pending" },
    labdipApprovedDate: Date,
    labdipApprovedBy: String,

    fabInHousePlannedDate: Date,           // already added

    photoSampleDue: Date,
    photoSamplePlannedDate: Date,
    photoSamplePlannedStatus: { type: String, default: "Pending" },
    photoSampleApprovedDate: Date,
    photoSampleApprovedBy: String,

    fptDueDate: Date,                      // already added
    gptDueDate: Date,                      // already added

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
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Tracker", trackerSchema);
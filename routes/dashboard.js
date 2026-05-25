const express = require('express');
const Tracker = require('../models/Tracker');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ======================================================
// 🚀 GET DASHBOARD STATS
// ======================================================

router.get('/', protect, async (req, res) => {
  try {
    // ======================================================
    // BASIC COUNTS
    // ======================================================
    const totalStyles = await Tracker.countDocuments();
    const vendorCount = await User.countDocuments({ role: 'vendor' });

    // ======================================================
    // PENDING COUNTS
    // ======================================================
    const pendingGPT = await Tracker.countDocuments({ plannedGPT: { $exists: false } });
    const pendingFPT = await Tracker.countDocuments({ plannedFPT: { $exists: false } });

    // ======================================================
    // DELAYED ENTRIES
    // ======================================================
    const delayedEntries = await Tracker.countDocuments({
      $or: [
        { plannedGPT: { $lt: new Date() } },
        { plannedFPT: { $lt: new Date() } }
      ]
    });

    // ======================================================
    // DYNAMIC STATUS HELPER FOR RED FIELDS
    // ======================================================
    const buildStatusQuery = (status) => {
      return {
        $or: [
          { labdipPlannedStatus: status },
          { photoSamplePlannedStatus: status },
          { plannedFPTStatus: status },
          { plannedGPTStatus: status },
          { gsmColorLotsPlannedStatus: status }
        ]
      };
    };

    // ======================================================
    // APPROVAL STATUS
    // ======================================================
    const approvedCount = await Tracker.countDocuments(buildStatusQuery('Approved'));
    const rejectedCount = await Tracker.countDocuments(buildStatusQuery('Rejected'));
    const pendingApprovalCount = await Tracker.countDocuments(buildStatusQuery('Pending'));

    // ======================================================
    // PRODUCTION STATUS
    // ======================================================
    const completedCount = await Tracker.countDocuments(buildStatusQuery('Completed'));
    const holdCount = await Tracker.countDocuments(buildStatusQuery('Hold'));
    const inProgressCount = await Tracker.countDocuments(buildStatusQuery('In Progress'));

    // ======================================================
    // PRIORITY COUNTS (Deprecated from Schema, returning 0)
    // ======================================================
    const urgentCount = 0;
    const highPriorityCount = 0;

    // ======================================================
    // RESPONSE
    // ======================================================
    res.json({
      totalStyles,
      vendorCount,
      pendingGPT,
      pendingFPT,
      delayedEntries,

      // Approval
      approvedCount,
      rejectedCount,
      pendingApprovalCount,

      // Production
      completedCount,
      holdCount,
      inProgressCount,

      // Priority
      urgentCount,
      highPriorityCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
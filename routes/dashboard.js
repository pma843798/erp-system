const express = require('express');
const Tracker = require('../models/Tracker');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();


router.get('/', protect, async (req, res) => {
  try {
  
    const totalStyles = await Tracker.countDocuments();
    const vendorCount = await User.countDocuments({ role: 'vendor' });

    const pendingGPT = await Tracker.countDocuments({ plannedGPT: { $exists: false } });
    const pendingFPT = await Tracker.countDocuments({ plannedFPT: { $exists: false } });

    const delayedEntries = await Tracker.countDocuments({
      $or: [
        { plannedGPT: { $lt: new Date() } },
        { plannedFPT: { $lt: new Date() } }
      ]
    });

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

    const approvedCount = await Tracker.countDocuments(buildStatusQuery('Approved'));
    const rejectedCount = await Tracker.countDocuments(buildStatusQuery('Rejected'));
    const pendingApprovalCount = await Tracker.countDocume
    const completedCount = await Tracker.countDocuments(buildStatusQuery('Completed'));
    const holdCount = await Tracker.countDocuments(buildStatusQuery('Hold'));
    const inProgressCount = await Tracker.countDocuments(buildStatusQuery('In Progress'));

    const urgentCount = 0;
    const highPriorityCount = 0;

    res.json({
      totalStyles,
      vendorCount,
      pendingGPT,
      pendingFPT,
      delayedEntries,

      approvedCount,
      rejectedCount,
      pendingApprovalCount,

      completedCount,
      holdCount,
      inProgressCount,

      urgentCount,
      highPriorityCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
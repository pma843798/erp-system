const express = require('express');
const Tracker = require('../models/Tracker');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const totalStyles = await Tracker.countDocuments();
    const vendorCount = await User.countDocuments({ role: 'vendor' });

    // ----- Pending counts based on STATUS, not field existence -----
    const pendingLabdip = await Tracker.countDocuments({ labdipPlannedStatus: 'Pending' });
    const pendingPhotoSample = await Tracker.countDocuments({ photoSamplePlannedStatus: 'Pending' });
    const pendingFPT = await Tracker.countDocuments({ plannedFPTStatus: 'Pending' });
    const pendingGPT = await Tracker.countDocuments({ plannedGPTStatus: 'Pending' });
    const pendingGSM = await Tracker.countDocuments({ gsmColorLotsPlannedStatus: 'Pending' });

    // ----- Approved counts per activity -----
    const approvedLabdip = await Tracker.countDocuments({ labdipPlannedStatus: 'Approved' });
    const approvedPhotoSample = await Tracker.countDocuments({ photoSamplePlannedStatus: 'Approved' });
    const approvedFPT = await Tracker.countDocuments({ plannedFPTStatus: 'Approved' });
    const approvedGPT = await Tracker.countDocuments({ plannedGPTStatus: 'Approved' });
    const approvedGSM = await Tracker.countDocuments({ gsmColorLotsPlannedStatus: 'Approved' });
    
    // Total approved (any activity approved)
    const totalApproved = await Tracker.countDocuments({
      $or: [
        { labdipPlannedStatus: 'Approved' },
        { photoSamplePlannedStatus: 'Approved' },
        { plannedFPTStatus: 'Approved' },
        { plannedGPTStatus: 'Approved' },
        { gsmColorLotsPlannedStatus: 'Approved' }
      ]
    });

    // ----- Delayed entries (using due dates) -----
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delayedEntries = await Tracker.countDocuments({
      $or: [
        { labdipQualityDeskloomDue: { $lt: today }, labdipPlannedStatus: { $ne: 'Approved' } },
        { photoSampleDue: { $lt: today }, photoSamplePlannedStatus: { $ne: 'Approved' } },
        { testReportDue: { $lt: today } }, // if test report also matters
        { gsmColorLotsDue: { $lt: today }, gsmColorLotsPlannedStatus: { $ne: 'Approved' } }
      ]
    });

    // ----- Rejected counts (any activity) -----
    const rejectedCount = await Tracker.countDocuments({
      $or: [
        { labdipPlannedStatus: 'Rejected' },
        { photoSamplePlannedStatus: 'Rejected' },
        { plannedFPTStatus: 'Rejected' },
        { plannedGPTStatus: 'Rejected' },
        { gsmColorLotsPlannedStatus: 'Rejected' }
      ]
    });

    // ----- Hold / In Progress from pendingStatus field (assuming you have this) -----
    const holdCount = await Tracker.countDocuments({ pendingStatus: 'Hold' });
    const inProgressCount = await Tracker.countDocuments({ pendingStatus: 'In Progress' });
    
    // Urgent priority
    const urgentCount = await Tracker.countDocuments({ priority: 'Urgent' });

    res.json({
      totalStyles,
      vendorCount,
      
      // Pending per activity
      pendingLabdip,
      pendingPhotoSample,
      pendingFPT,
      pendingGPT,
      pendingGSM,
      
      // Approved per activity
      approvedLabdip,
      approvedPhotoSample,
      approvedFPT,
      approvedGPT,
      approvedGSM,
      totalApproved,
      
      rejectedCount,
      delayedEntries,
      holdCount,
      inProgressCount,
      urgentCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
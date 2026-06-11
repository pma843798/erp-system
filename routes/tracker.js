const express = require('express');
const Tracker = require('../models/Tracker');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Vendor editable fields (fabInHousePlannedDate allowed, fptDueDate/gptDueDate NOT allowed)
const vendorEditableFields = [
  'labdipPlannedDate',
  'photoSamplePlannedDate',
  'plannedFPT',
  'plannedGPT',
  'gsmColorLotsPlanned',

  'labdipPlannedStatus',
  'photoSamplePlannedStatus',
  'plannedFPTStatus',
  'plannedGPTStatus',
  'gsmColorLotsPlannedStatus',

  'approvalStatus',
  'pendingStatus',
  'buyerApproval',
  'priority',

  'remark',

  'fabInHousePlannedDate',   // vendor set kar sakta hai
];

const getComparableValue = (val) => {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  return val.toString();
};

// GET all entries (with populated history)
router.get('/', protect, async (req, res) => {
  try {
    const entries = await Tracker.find({})
      .populate('history.changedBy', 'name email');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single entry by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const entry = await Tracker.findById(req.params.id)
      .populate('history.changedBy', 'name email');
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Admin & PMA only) – no extra PMA restrictions
router.post('/', protect, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'pma') {
    return res.status(403).json({ message: 'Only Admin or PMA can create entries' });
  }
  try {
    const entry = await Tracker.create(req.body);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT – Update with auto‑approval
router.put('/:id', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    const entry = await Tracker.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const updates = req.body;

    // Auto‑set approvedBy/date
    const approvalMap = {
      labdipPlannedStatus:      { by: 'labdipApprovedBy',      dt: 'labdipApprovedDate' },
      photoSamplePlannedStatus: { by: 'photoSampleApprovedBy', dt: 'photoSampleApprovedDate' },
      plannedFPTStatus:         { by: 'plannedFPTApprovedBy',  dt: 'plannedFPTApprovedDate' },
      plannedGPTStatus:         { by: 'plannedGPTApprovedBy',  dt: 'plannedGPTApprovedDate' },
      gsmColorLotsPlannedStatus:{ by: 'gsmColorLotsApprovedBy',dt: 'gsmColorLotsApprovedDate' }
    };

    Object.keys(approvalMap).forEach(statusField => {
      if (updates[statusField] === 'Approved') {
        if (!updates[approvalMap[statusField].by]) {
          updates[approvalMap[statusField].by] = req.user?.name || 'Admin';
        }
        if (!updates[approvalMap[statusField].dt]) {
          updates[approvalMap[statusField].dt] = new Date();
        }
      }
    });

    const historyEntries = [];

    for (let field in updates) {
      // Vendor permission check (only vendor restricted, PMA/Admin unrestricted)
      if (req.user.role === 'vendor' && !vendorEditableFields.includes(field)) {
        return res.status(403).json({ message: `Vendor cannot edit field: ${field}` });
      }

      const currentRawVal = entry.get(field);
      const updateRawVal = updates[field];

      const oldVal = getComparableValue(currentRawVal);
      const newVal = getComparableValue(updateRawVal);

      if (oldVal !== newVal) {
        historyEntries.push({
          field,
          oldValue: oldVal || 'None',
          newValue: newVal || 'None',
          changedBy: req.user._id,
          role: req.user.role,
          changedAt: new Date()
        });
      }
    }

    entry.set(updates);

    if (historyEntries.length > 0) {
      entry.history.push(...historyEntries);
    }

    await entry.save();

    const updatedEntry = await Tracker.findById(req.params.id)
      .populate('history.changedBy', 'name email');
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE history (Admin only)
router.delete('/history/:id', protect, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete history' });
  }
  try {
    const { field, historyIds } = req.body;
    const entryId = req.params.id;

    if (!entryId) {
      return res.status(400).json({ message: 'Entry ID required' });
    }

    if (historyIds && Array.isArray(historyIds) && historyIds.length > 0) {
      await Tracker.updateOne(
        { _id: entryId },
        { $pull: { history: { _id: { $in: historyIds } } } }
      );
      return res.json({ message: `Deleted ${historyIds.length} selected history entries` });
    }
    
    if (field) {
      await Tracker.updateOne(
        { _id: entryId },
        { $pull: { history: { field } } }
      );
      return res.json({ message: `All history cleared for field: ${field}` });
    }

    return res.status(400).json({ message: 'Either field or historyIds must be provided' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE multiple entries (Admin only)
router.delete('/', protect, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  try {
    const { ids } = req.body;
    await Tracker.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Entries deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// RENAME dynamic column (Admin only)
router.put('/column/rename', protect, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can rename columns' });
  }
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Provide both old and new names' });
    }
    await Tracker.updateMany({}, { $rename: { [oldName]: newName } }, { strict: false });
    res.json({ message: `Column renamed to ${newName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
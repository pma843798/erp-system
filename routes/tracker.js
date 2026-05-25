const express = require('express');
const Tracker = require('../models/Tracker');
const { protect } = require('../middleware/auth');

const router = express.Router();

const vendorEditableFields = [

  // ======================================================
  // DATE FIELDS
  // ======================================================

  'labdipPlannedDate',

  'photoSamplePlannedDate',

  'plannedFPT',

  'plannedGPT',

  'gsmColorLotsPlanned',

  // ======================================================
  // STATUS FIELDS (RED FIELDS)
  // ======================================================

  'labdipPlannedStatus',

  'photoSamplePlannedStatus',

  'plannedFPTStatus',

  'plannedGPTStatus',

  'gsmColorLotsPlannedStatus',

  // ======================================================
  // GLOBAL STATUS FIELDS
  // ======================================================

  'approvalStatus',

  'pendingStatus',

  'buyerApproval',

  'priority',

  // ======================================================
  // REMARK
  // ======================================================

  'remark'
];

// Helper for generic value comparison
const getComparableValue = (val) => {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  return val.toString();
};

// GET all
router.get('/', protect, async (req, res) => {
  try {
    const entries = await Tracker.find({})
      .populate('history.changedBy', 'name email');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Admin & PMA can create entries)
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

// PUT with role-based editing & history for BOTH hardcoded and dynamic fields
router.put('/:id', protect, async (req, res) => {
  try {
    const entry = await Tracker.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const updates = req.body;
    const historyEntries = [];

    // Identify standard fields from Schema vs dynamic fields
    const schemaPaths = Object.keys(Tracker.schema.paths);

    for (let field in updates) {
      // Security Check for Vendor
      if (req.user.role === 'vendor' && !vendorEditableFields.includes(field)) {
        return res.status(403).json({ message: `Vendor cannot edit field: ${field}` });
      }

      // Handle nested or dynamic fields gracefully
      // entry[field] handles strict schema paths, entry.get(field) handles mixed/dynamic ones
      const currentRawVal = entry.get(field); 
      const updateRawVal = updates[field];

      const oldVal = getComparableValue(currentRawVal);
      const newVal = getComparableValue(updateRawVal);

      if (oldVal !== newVal) {
        historyEntries.push({
          field,
          oldValue: oldVal || 'None', // Keep fallback simple for DB
          newValue: newVal || 'None',
          changedBy: req.user._id,
          role: req.user.role,
        });
      }
    }

    // Apply updates using set() which works better for dynamic fields in strict:false schemas
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

// NEW API: DELETE History for a specific cell/field (Admin only)
router.delete('/history/:id', protect, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete history' });
    }
    try {
      const { field } = req.body; // Pass the field name from frontend
      const entry = await Tracker.findById(req.params.id);
      
      if (!entry) return res.status(404).json({ message: 'Entry not found' });
  
      // Filter out history related to the specific field
      if (field) {
         entry.history = entry.history.filter(h => h.field !== field);
      } else {
         // If no field specified, wipe all history for this entry
         entry.history = [];
      }
  
      await entry.save();
      res.json({ message: 'History cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// DELETE multiple entries (Admin only)
router.delete('/', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
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
// RENAME DYNAMIC COLUMN (Admin Only)
router.put('/column/rename', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can rename columns' });
  }
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Provide both old and new names' });
    }
    
    // Database mein sabhi jagah purane naam ko naye naam se replace kar dega
    await Tracker.updateMany({}, { $rename: { [oldName]: newName } }, { strict: false });
    res.json({ message: `Column renamed to ${newName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
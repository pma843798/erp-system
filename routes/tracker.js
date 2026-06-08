const express = require('express');
const Tracker = require('../models/Tracker');
const { protect } = require('../middleware/auth');

const router = express.Router();

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

  'remark'
];

const getComparableValue = (val) => {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  return val.toString();
};

router.get('/', protect, async (req, res) => {
  try {
    const entries = await Tracker.find({})
      .populate('history.changedBy', 'name email');
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

router.put('/:id', protect, async (req, res) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    const entry = await Tracker.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const updates = req.body;

    const approvalMap = {
      labdipPlannedStatus:      { by: 'labdipApprovedBy',      date: 'labdipApprovedDate' },
      photoSamplePlannedStatus: { by: 'photoSampleApprovedBy', date: 'photoSampleApprovedDate' },
      plannedFPTStatus:         { by: 'plannedFPTApprovedBy',  date: 'plannedFPTApprovedDate' },
      plannedGPTStatus:         { by: 'plannedGPTApprovedBy',  date: 'plannedGPTApprovedDate' },
      gsmColorLotsPlannedStatus:{ by: 'gsmColorLotsApprovedBy',date: 'gsmColorLotsApprovedDate' }
    };

    Object.keys(approvalMap).forEach(statusField => {
      if (updates[statusField] === 'Approved') {
        const { by, date } = approvalMap[statusField];
        updates[by] = req.user.name;  
        updates[date] = new Date();
      }
    });
    
    const historyEntries = [];

    
    const schemaPaths = Object.keys(Tracker.schema.paths);

    for (let field in updates) {
    
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
          
          date: new Date()
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

router.delete('/history/:id', protect, async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete history' });
    }
    try {
      const { field } = req.body; 
      const entry = await Tracker.findById(req.params.id);
      
      if (!entry) return res.status(404).json({ message: 'Entry not found' });
  
      
      if (field) {
         entry.history = entry.history.filter(h => h.field !== field);
      } else {
         
         entry.history = [];
      }
  
      await entry.save();
      res.json({ message: 'History cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

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
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const PlatformSignature = require('../models/PlatformSignature');

// Get the current Platform (CEO) Signature
router.get('/signature', async (req, res) => {
  try {
    const signature = await PlatformSignature.findOne().sort({ createdAt: -1 });
    if (!signature) {
      return res.json({ name: 'EduX CEO', signatureUrl: '' });
    }
    res.json(signature);
  } catch (error) {
    console.error('Error fetching platform signature:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update or create the Platform (CEO) Signature
router.put('/signature', [auth, requireRole(['ADMIN'])], async (req, res) => {
  try {
    const { name, signatureUrl } = req.body;

    if (!signatureUrl) {
      return res.status(400).json({ message: 'Signature URL is required' });
    }

    let signature = await PlatformSignature.findOne();

    if (signature) {
      signature.signatureUrl = signatureUrl;
      if (name) signature.name = name;
      signature.updatedBy = req.user._id;
      await signature.save();
    } else {
      signature = new PlatformSignature({
        name: name || 'Muni Mahesh',
        signatureUrl,
        updatedBy: req.user._id
      });
      await signature.save();
    }

    res.json({ message: 'Platform signature updated successfully', signature });
  } catch (error) {
    console.error('Error updating platform signature:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

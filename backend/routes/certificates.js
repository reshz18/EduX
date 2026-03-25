const express = require('express');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const PlatformSignature = require('../models/PlatformSignature');
const { auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');

const router = express.Router();

// Helper to fetch image from URL as buffer
async function fetchImageBuffer(url) {
  if (!url) return null;
  if (url.startsWith('data:image')) return url; // Let pdfkit handle data URLs directly if possible
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (err) {
    console.error(`Failed to fetch image from ${url}:`, err.message);
    return null;
  }
}

// Download certificate as PDF
router.get('/:certificateId/download', auth, async (req, res) => {
  try {
    console.log('Certificate download requested:', req.params.certificateId);
    
    // 1. Fetch certificate data
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId });

    if (!certificate) {
      console.error('Certificate not found:', req.params.certificateId);
      return res.status(404).json({ message: 'Certificate not found' });
    }

    console.log('Certificate found:', certificate.certificateId, 'for user:', certificate.userName);

    // Security check: Only the owner or an admin can download
    if (certificate.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      console.error('Unauthorized access attempt by:', req.user._id);
      return res.status(403).json({ message: 'Not authorized to download this certificate' });
    }

    const platformSignature = await PlatformSignature.findOne().sort({ createdAt: -1 });
    
    // 2. Setup PDF Generation
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0
    });

    const filename = `${certificate.userName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // --- Styling & Background ---
    const width = doc.page.width;
    const height = doc.page.height;

    // Background color
    doc.rect(0, 0, width, height).fill('#f8fafc');

    // Outer Border
    doc.lineWidth(15);
    doc.strokeColor('#1e3a8a'); // Dark blue
    doc.rect(20, 20, width - 40, height - 40).stroke();

    // Inner Border
    doc.lineWidth(2);
    doc.strokeColor('#3b82f6'); // Lighter blue
    doc.rect(30, 30, width - 60, height - 60).stroke();

    // 3. Header
    doc.moveDown(4);
    doc.font('Helvetica-Bold')
       .fontSize(36)
       .fillColor('#1e40af')
       .text('CERTIFICATE OF COMPLETION', { align: 'center' });
       
    doc.moveDown(0.5);
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#64748b')
       .text('This proudly certifies that', { align: 'center' });

    // 4. Student Name
    doc.moveDown(1);
    doc.font('Helvetica-Bold')
       .fontSize(40)
       .fillColor('#0f172a')
       .text(certificate.userName, { align: 'center' });

    // Divider line
    doc.moveDown(0.2);
    doc.lineWidth(1);
    doc.strokeColor('#cbd5e1');
    doc.moveTo(width / 2 - 200, doc.y).lineTo(width / 2 + 200, doc.y).stroke();

    // 5. Course Name
    doc.moveDown(1);
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#64748b')
       .text('has successfully completed the course:', { align: 'center' });

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('#1e3a8a')
       .text(certificate.courseName, { align: 'center' });

    // 6. Signatures & Dates Area (Bottom)
    const signatureY = height - 180;
    
    // Date
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#64748b')
       .text('Date of Completion', 100, signatureY + 40);
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#0f172a')
       .text(new Date(certificate.completionDate).toLocaleDateString(), 100, signatureY + 20);
    doc.lineWidth(1).strokeColor('#0f172a').moveTo(100, signatureY + 35).lineTo(220, signatureY + 35).stroke();

    // Instructor Signature
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#64748b')
       .text('Course Instructor', 350, signatureY + 40);
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#0f172a')
       .text(certificate.instructorName, 350, signatureY + 20);
    doc.lineWidth(1).strokeColor('#0f172a').moveTo(350, signatureY + 35).lineTo(470, signatureY + 35).stroke();
    
    if (certificate.instructorSignatureUrl) {
      try {
        if (certificate.instructorSignatureUrl.startsWith('data:image')) {
          doc.image(certificate.instructorSignatureUrl, 350, signatureY - 30, { height: 40, width: 120, cover: [120, 40] });
        } else {
          const imgBuffer = await fetchImageBuffer(certificate.instructorSignatureUrl);
          if (imgBuffer) doc.image(imgBuffer, 350, signatureY - 30, { height: 40, width: 120, cover: [120, 40] });
        }
      } catch (e) {
        console.error('Error drawing instructor signature');
      }
    }

    // CEO/Platform Signature
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#64748b')
       .text(platformSignature ? platformSignature.name : 'Platform CEO', 600, signatureY + 40);
    doc.lineWidth(1).strokeColor('#0f172a').moveTo(600, signatureY + 35).lineTo(720, signatureY + 35).stroke();
    
    if (platformSignature && platformSignature.signatureUrl) {
      try {
        if (platformSignature.signatureUrl.startsWith('data:image')) {
          doc.image(platformSignature.signatureUrl, 600, signatureY - 30, { height: 40, width: 120, cover: [120, 40] });
        } else {
          const imgBuffer = await fetchImageBuffer(platformSignature.signatureUrl);
          if (imgBuffer) doc.image(imgBuffer, 600, signatureY - 30, { height: 40, width: 120, cover: [120, 40] });
        }
      } catch (e) {
        console.error('Error drawing CEO signature');
      }
    }

    // 7. QR Code & Verify Link
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}`;
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 80 });
      doc.image(qrCodeDataUrl, width - 120, height - 120, { width: 80, height: 80 });
    } catch (err) {
      console.error('QR Code generation failed', err);
    }

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#94a3b8')
       .text(`Certificate ID: ${certificate.certificateId}`, 60, height - 60);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Certificate ID:', req.params.certificateId);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating certificate PDF', error: error.message });
    }
  }
});

// Verify certificate (Public Endpoint)
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateId: req.params.certificateId 
    });

    if (!certificate) {
      return res.status(404).json({ 
        isValid: false,
        message: 'Certificate not found or invalid'
      });
    }

    res.json({
      isValid: true,
      certificate: {
        id: certificate.certificateId,
        studentName: certificate.userName,
        courseName: certificate.courseName,
        instructor: certificate.instructorName,
        completionDate: certificate.completionDate,
        issuedDate: certificate.issuedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete certificate
router.delete('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this certificate' });
    }

    await Certificate.findByIdAndDelete(req.params.id);

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
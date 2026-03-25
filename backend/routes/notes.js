const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all notes (public + user's private notes)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const query = {
      $or: [
        { isPublic: true },
        { author: req.user._id }
      ]
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      ];
      delete query.$or;
    }

    const notes = await Note.find(query)
      .populate('author', 'name avatar')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get note by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('course', 'title');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user can access this note
    if (!note.isPublic && note.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment views
    note.views += 1;
    await note.save();

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create note
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('isPublic').optional().isBoolean(),
  body('category').optional().isString(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const noteData = {
      ...req.body,
      author: req.user._id
    };

    const note = new Note(noteData);
    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name avatar')
      .populate('course', 'title');

    res.status(201).json(populatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update note
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('isPublic').optional().isBoolean(),
  body('category').optional().isString(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('author', 'name avatar').populate('course', 'title');

    res.json(updatedNote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike note
router.post('/:id/like', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const likeIndex = note.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      // Unlike
      note.likes.splice(likeIndex, 1);
    } else {
      // Like
      note.likes.push(req.user._id);
    }

    await note.save();

    res.json({
      likes: note.likes.length,
      isLiked: note.likes.includes(req.user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
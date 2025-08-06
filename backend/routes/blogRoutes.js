const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Blog validation rules
const blogValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('slug')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Slug must not exceed 255 characters')
    .matches(/^[\u0980-\u09FF\u0900-\u097Fa-z0-9\-]*$/)
    .withMessage('Slug can only contain letters (English/Bangla), numbers, and hyphens'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  body('category_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('meta_keywords')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Meta keywords must not exceed 500 characters'),
  body('meta_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters')
];

// Helper function to generate slug from title (supports Bangla)
const generateSlug = (title) => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters but keep Bangla characters, English letters, numbers, and hyphens
    .replace(/[^\u0980-\u09FF\u0900-\u097Fa-z0-9\-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

// Helper function to delete image file
const deleteImageFile = (imagePath) => {
  if (imagePath) {
    const fullPath = path.join(__dirname, '..', imagePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting image:', err);
      }
    });
  }
};

// @route   GET /api/blogs
// @desc    Get all blogs with pagination
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = `
      SELECT 
        b.*,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM blogs b WHERE 1=1';
    let queryParams = [];
    let countParams = [];

    if (search) {
      query += ' AND (b.title LIKE ? OR b.content LIKE ? OR b.author LIKE ?)';
      countQuery += ' AND (b.title LIKE ? OR b.content LIKE ? OR b.author LIKE ?)';
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (category) {
      query += ' AND b.category_id = ?';
      countQuery += ' AND b.category_id = ?';
      queryParams.push(category);
      countParams.push(category);
    }

    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [blogs] = await db.execute(query, queryParams);
    const [totalResult] = await db.execute(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: {
        blogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs'
    });
  }
});

// @route   GET /api/blogs/:id
// @desc    Get single blog
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        b.*,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog retrieved successfully',
      data: rows[0]
    });

  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog'
    });
  }
});

// @route   POST /api/blogs
// @desc    Create new blog
// @access  Private
router.post('/', authMiddleware, upload.single('image'), handleUploadError, blogValidation, async (req, res) => {
  try {
    // Debug: Log the received data
    console.log('Received blog data:', req.body);
    console.log('Received file:', req.file);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        deleteImageFile(req.file.path);
      }
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let { title, content, slug, author, category_id, meta_keywords, meta_description } = req.body;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(title);
    }

    // Check if slug already exists
    const [existingBlog] = await db.execute(
      'SELECT id FROM blogs WHERE slug = ?',
      [slug]
    );

    if (existingBlog.length > 0) {
      if (req.file) {
        deleteImageFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Slug already exists. Please choose a different slug.'
      });
    }

    // Check if category exists (if provided)
    if (category_id) {
      const [categoryCheck] = await db.execute(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categoryCheck.length === 0) {
        if (req.file) {
          deleteImageFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    const imagePath = req.file ? `uploads/images/${req.file.filename}` : null;

    // Create new blog
    const [result] = await db.execute(`
      INSERT INTO blogs (title, content, slug, author, category_id, image, meta_keywords, meta_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, content, slug, author, category_id || null, imagePath, meta_keywords || null, meta_description || null]);

    // Fetch the created blog with category name
    const [newBlog] = await db.execute(`
      SELECT 
        b.*,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: newBlog[0]
    });

  } catch (error) {
    console.error('Create blog error:', error);
    // Delete uploaded file on error
    if (req.file) {
      deleteImageFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating blog'
    });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update blog
// @access  Private
router.put('/:id', authMiddleware, upload.single('image'), handleUploadError, blogValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        deleteImageFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    let { title, content, slug, author, category_id, meta_keywords, meta_description } = req.body;

    // Check if blog exists
    const [existingBlog] = await db.execute(
      'SELECT * FROM blogs WHERE id = ?',
      [id]
    );

    if (existingBlog.length === 0) {
      if (req.file) {
        deleteImageFile(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Auto-generate slug if not provided
    if (!slug) {
      slug = generateSlug(title);
    }

    // Check if slug already exists (excluding current blog)
    const [slugCheck] = await db.execute(
      'SELECT id FROM blogs WHERE slug = ? AND id != ?',
      [slug, id]
    );

    if (slugCheck.length > 0) {
      if (req.file) {
        deleteImageFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Slug already exists. Please choose a different slug.'
      });
    }

    // Check if category exists (if provided)
    if (category_id) {
      const [categoryCheck] = await db.execute(
        'SELECT id FROM categories WHERE id = ?',
        [category_id]
      );

      if (categoryCheck.length === 0) {
        if (req.file) {
          deleteImageFile(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    let imagePath = existingBlog[0].image;

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (existingBlog[0].image) {
        deleteImageFile(existingBlog[0].image);
      }
      imagePath = `uploads/images/${req.file.filename}`;
    }

    // Update blog
    await db.execute(`
      UPDATE blogs 
      SET title = ?, content = ?, slug = ?, author = ?, category_id = ?, 
          image = ?, meta_keywords = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content, slug, author, category_id || null, imagePath, meta_keywords || null, meta_description || null, id]);

    // Fetch updated blog with category name
    const [updatedBlog] = await db.execute(`
      SELECT 
        b.*,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog[0]
    });

  } catch (error) {
    console.error('Update blog error:', error);
    if (req.file) {
      deleteImageFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating blog'
    });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete blog
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if blog exists and get image path
    const [existingBlog] = await db.execute(
      'SELECT image FROM blogs WHERE id = ?',
      [id]
    );

    if (existingBlog.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete blog from database
    await db.execute('DELETE FROM blogs WHERE id = ?', [id]);

    // Delete associated image file
    if (existingBlog[0].image) {
      deleteImageFile(existingBlog[0].image);
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting blog'
    });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Category validation rules
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and underscores')
];

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        c.*,
        COUNT(b.id) as blog_count
      FROM categories c
      LEFT JOIN blogs b ON c.id = b.category_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: rows
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        c.*,
        COUNT(b.id) as blog_count
      FROM categories c
      LEFT JOIN blogs b ON c.id = b.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: rows[0]
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', authMiddleware, categoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name } = req.body;

    // Check if category name already exists
    const [existingRows] = await db.execute(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Create new category
    const [result] = await db.execute(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );

    // Fetch the created category
    const [newCategory] = await db.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory[0]
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', authMiddleware, categoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name } = req.body;

    // Check if category exists
    const [existingCategory] = await db.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name already exists (excluding current category)
    const [nameCheck] = await db.execute(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name, id]
    );

    if (nameCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Update category
    await db.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, id]
    );

    // Fetch updated category
    const [updatedCategory] = await db.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory[0]
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existingCategory] = await db.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has associated blogs
    const [associatedBlogs] = await db.execute(
      'SELECT COUNT(*) as count FROM blogs WHERE category_id = ?',
      [id]
    );

    if (associatedBlogs[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${associatedBlogs[0].count} associated blog(s). Please reassign or delete the blogs first.`
      });
    }

    // Delete category
    await db.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category'
    });
  }
});

module.exports = router;
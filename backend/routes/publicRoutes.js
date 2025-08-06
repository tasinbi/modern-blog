const express = require('express');
const db = require('../config/database');

const router = express.Router();

// @route   GET /api/public/blogs
// @desc    Get published blogs for public viewing
// @access  Public
router.get('/blogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = `
      SELECT 
        b.id,
        b.title,
        b.content,
        b.slug,
        b.author,
        b.category_id,
        b.image,
        b.meta_keywords,
        b.meta_description,
        b.views,
        b.created_at,
        b.updated_at,
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
    console.error('Get public blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs'
    });
  }
});

// @route   GET /api/public/blogs/:slug
// @desc    Get single blog by slug
// @access  Public
router.get('/blogs/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        b.*,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.slug = ?
    `, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const blog = rows[0];

    // Increment view count
    await db.execute(
      'UPDATE blogs SET views = views + 1 WHERE id = ?',
      [blog.id]
    );

    blog.views += 1;

    res.json({
      success: true,
      message: 'Blog retrieved successfully',
      data: blog
    });

  } catch (error) {
    console.error('Get public blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog'
    });
  }
});

// @route   GET /api/public/categories
// @desc    Get all categories for public use
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        c.id,
        c.name,
        c.created_at,
        COUNT(b.id) as blog_count
      FROM categories c
      LEFT JOIN blogs b ON c.id = b.category_id
      GROUP BY c.id, c.name, c.created_at
      HAVING blog_count > 0
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: rows
    });

  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @route   GET /api/public/featured
// @desc    Get featured blogs (most viewed)
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const [rows] = await db.execute(`
      SELECT 
        b.id,
        b.title,
        b.content,
        b.slug,
        b.author,
        b.image,
        b.views,
        b.created_at,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.views DESC, b.created_at DESC
      LIMIT ?
    `, [limit]);

    res.json({
      success: true,
      message: 'Featured blogs retrieved successfully',
      data: rows
    });

  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured blogs'
    });
  }
});

// @route   GET /api/public/recent
// @desc    Get recent blogs
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const [rows] = await db.execute(`
      SELECT 
        b.id,
        b.title,
        b.content,
        b.slug,
        b.author,
        b.image,
        b.views,
        b.created_at,
        c.name as category_name
      FROM blogs b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `, [limit]);

    res.json({
      success: true,
      message: 'Recent blogs retrieved successfully',
      data: rows
    });

  } catch (error) {
    console.error('Get recent blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent blogs'
    });
  }
});

// @route   GET /api/public/stats
// @desc    Get blog statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [totalBlogs] = await db.execute('SELECT COUNT(*) as count FROM blogs');
    const [totalCategories] = await db.execute('SELECT COUNT(*) as count FROM categories');
    const [totalViews] = await db.execute('SELECT SUM(views) as total FROM blogs');

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        total_blogs: totalBlogs[0].count,
        total_categories: totalCategories[0].count,
        total_views: totalViews[0].total || 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;
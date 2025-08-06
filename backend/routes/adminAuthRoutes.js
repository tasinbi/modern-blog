const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registrationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Helper function to generate JWT token
const generateToken = (adminId, email, role) => {
  return jwt.sign(
    { 
      id: adminId, 
      email: email, 
      role: role,
      type: 'admin' 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/admin-auth/register
// @desc    Register new admin (requires existing admin authentication)
// @access  Private (Admin only)
router.post('/register', authMiddleware, registrationValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'admin' } = req.body;

    // Check if requester is admin
    const requesterId = req.user.id;
    const [requesterData] = await db.execute(
      'SELECT role FROM admin_users WHERE id = ?',
      [requesterId]
    );

    if (!requesterData.length || (requesterData[0].role !== 'super_admin' && requesterData[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create new admin accounts'
      });
    }

    // Check if admin already exists
    const [existingAdmin] = await db.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      [email]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Validate role
    const validRoles = ['admin', 'super_admin'];
    const adminRole = validRoles.includes(role) ? role : 'admin';

    // Only super_admin can create super_admin
    if (adminRole === 'super_admin' && requesterData[0].role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can create super admin accounts'
      });
    }

    // Insert new admin
    const [result] = await db.execute(
      'INSERT INTO admin_users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, adminRole]
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: result.insertId,
        name,
        email,
        role: adminRole
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin registration'
    });
  }
});

// @route   POST /api/admin-auth/login
// @desc    Admin login
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin by email
    const [admins] = await db.execute(
      'SELECT id, name, email, password, role, is_active FROM admin_users WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = admins[0];

    // Check if admin is active
    if (!admin.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await db.execute(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // Generate JWT token
    const token = generateToken(admin.id, admin.email, admin.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/admin-auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find admin by email
    const [admins] = await db.execute(
      'SELECT id, name, email, is_active FROM admin_users WHERE email = ?',
      [email]
    );

    // Always return success for security (don't reveal if email exists)
    if (admins.length === 0) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const admin = admins[0];

    // Check if admin is active
    if (!admin.is_active) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this admin
    await db.execute(
      'DELETE FROM password_reset_tokens WHERE admin_id = ?',
      [admin.id]
    );

    // Insert new reset token
    await db.execute(
      'INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)',
      [admin.id, resetToken, expiresAt]
    );

    // Send reset email
    try {
      const emailResult = await sendPasswordResetEmail(email, resetToken, admin.name);
      if (!emailResult.success) {
        throw new Error(emailResult.error);
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/admin-auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Find valid reset token
    const [tokens] = await db.execute(`
      SELECT 
        prt.id, 
        prt.admin_id, 
        prt.expires_at, 
        prt.used,
        au.email,
        au.name,
        au.is_active
      FROM password_reset_tokens prt
      JOIN admin_users au ON prt.admin_id = au.id
      WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()
    `, [token]);

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const resetData = tokens[0];

    // Check if admin is active
    if (!resetData.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Start transaction
    await db.execute('START TRANSACTION');

    try {
      // Update password
      await db.execute(
        'UPDATE admin_users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, resetData.admin_id]
      );

      // Mark token as used
      await db.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
        [resetData.id]
      );

      // Clean up old tokens for this admin
      await db.execute(
        'DELETE FROM password_reset_tokens WHERE admin_id = ? AND id != ?',
        [resetData.admin_id, resetData.id]
      );

      await db.execute('COMMIT');

      res.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });

    } catch (updateError) {
      await db.execute('ROLLBACK');
      throw updateError;
    }

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   GET /api/admin-auth/verify
// @desc    Verify admin token
// @access  Private
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get admin details
    const [admins] = await db.execute(
      'SELECT id, name, email, role, is_active, last_login FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || !admins[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or deactivated admin account'
      });
    }

    const admin = admins[0];

    res.json({
      success: true,
      message: 'Admin token is valid',
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          last_login: admin.last_login
        }
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

// @route   GET /api/admin-auth/admins
// @desc    Get all admin users (super admin only)
// @access  Private (Super Admin only)
router.get('/admins', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id;

    // Check if requester is super admin
    const [requesterData] = await db.execute(
      'SELECT role FROM admin_users WHERE id = ?',
      [requesterId]
    );

    if (!requesterData.length || requesterData[0].role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can view all admin accounts'
      });
    }

    // Get all admins
    const [admins] = await db.execute(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        is_active, 
        last_login, 
        created_at 
      FROM admin_users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      message: 'Admin users retrieved successfully',
      data: admins
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin users'
    });
  }
});

// @route   PUT /api/admin-auth/admins/:id/status
// @desc    Activate/Deactivate admin user (super admin only)
// @access  Private (Super Admin only)
router.put('/admins/:id/status', authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const adminId = req.params.id;
    const { is_active } = req.body;

    // Check if requester is super admin
    const [requesterData] = await db.execute(
      'SELECT role FROM admin_users WHERE id = ?',
      [requesterId]
    );

    if (!requesterData.length || requesterData[0].role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can change admin status'
      });
    }

    // Can't deactivate yourself
    if (parseInt(adminId) === parseInt(requesterId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own status'
      });
    }

    // Update admin status
    const [result] = await db.execute(
      'UPDATE admin_users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, adminId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: `Admin ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update admin status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating admin status'
    });
  }
});

module.exports = router;
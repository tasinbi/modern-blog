const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all site settings (public route)
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, file_path FROM site_settings'
    );
    
    // Convert array to object for easier frontend usage
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = {
        value: setting.setting_value,
        filePath: setting.file_path
      };
    });
    
    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings'
    });
  }
});

// Upload logo (admin only)
router.post('/upload-logo', 
  authMiddleware,
  upload.single('logo'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No logo file uploaded'
        });
      }

      const logoPath = `/uploads/logos/${req.file.filename}`;
      
      // Get current logo to delete old file
      const [currentLogo] = await db.execute(
        'SELECT file_path FROM site_settings WHERE setting_key = ?',
        ['site_logo']
      );
      
      // Update logo path in database
      await db.execute(
        `INSERT INTO site_settings (setting_key, setting_value, file_path) 
         VALUES ('site_logo', 'Custom Logo', ?) 
         ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), updated_at = CURRENT_TIMESTAMP`,
        [logoPath]
      );
      
      // Delete old logo file if exists
      if (currentLogo[0]?.file_path && currentLogo[0].file_path !== logoPath) {
        const oldFilePath = path.join(__dirname, '..', currentLogo[0].file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        logoPath: logoPath
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      
      // Delete uploaded file if database update failed
      if (req.file) {
        const filePath = path.join(__dirname, '..', 'uploads', 'logos', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo'
      });
    }
  }
);

// Upload favicon (admin only)
router.post('/upload-favicon', 
  authMiddleware,
  upload.single('favicon'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No favicon file uploaded'
        });
      }

      const faviconPath = `/uploads/favicons/${req.file.filename}`;
      
      // Get current favicon to delete old file
      const [currentFavicon] = await db.execute(
        'SELECT file_path FROM site_settings WHERE setting_key = ?',
        ['site_favicon']
      );
      
      // Update favicon path in database
      await db.execute(
        `INSERT INTO site_settings (setting_key, setting_value, file_path) 
         VALUES ('site_favicon', 'Custom Favicon', ?) 
         ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), updated_at = CURRENT_TIMESTAMP`,
        [faviconPath]
      );
      
      // Delete old favicon file if exists and it's not the default
      if (currentFavicon[0]?.file_path && 
          currentFavicon[0].file_path !== faviconPath && 
          currentFavicon[0].file_path !== '/favicon.ico') {
        const oldFilePath = path.join(__dirname, '..', currentFavicon[0].file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      res.json({
        success: true,
        message: 'Favicon uploaded successfully',
        faviconPath: faviconPath
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      
      // Delete uploaded file if database update failed
      if (req.file) {
        const filePath = path.join(__dirname, '..', 'uploads', 'favicons', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload favicon'
      });
    }
  }
);

// Update site setting (admin only)
router.put('/setting/:key',
  authMiddleware,
  [
    body('value')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Setting value must be between 1 and 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { key } = req.params;
      const { value } = req.body;
      
      // Allowed settings to update
      const allowedSettings = ['site_title', 'site_description', 'theme_mode'];
      if (!allowedSettings.includes(key)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid setting key'
        });
      }
      
      await db.execute(
        `INSERT INTO site_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
      
      res.json({
        success: true,
        message: 'Setting updated successfully'
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update setting'
      });
    }
  }
);

// Reset logo to default (admin only)
router.delete('/logo', authMiddleware, async (req, res) => {
  try {
    // Get current logo to delete file
    const [currentLogo] = await db.execute(
      'SELECT file_path FROM site_settings WHERE setting_key = ?',
      ['site_logo']
    );
    
    // Reset to default
    await db.execute(
      `INSERT INTO site_settings (setting_key, setting_value, file_path) 
       VALUES ('site_logo', 'Banglay IELTS', NULL) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), file_path = VALUES(file_path), updated_at = CURRENT_TIMESTAMP`
    );
    
    // Delete old logo file if exists
    if (currentLogo[0]?.file_path) {
      const oldFilePath = path.join(__dirname, '..', currentLogo[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    res.json({
      success: true,
      message: 'Logo reset to default successfully'
    });
  } catch (error) {
    console.error('Error resetting logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset logo'
    });
  }
});

// Reset favicon to default (admin only)
router.delete('/favicon', authMiddleware, async (req, res) => {
  try {
    // Get current favicon to delete file
    const [currentFavicon] = await db.execute(
      'SELECT file_path FROM site_settings WHERE setting_key = ?',
      ['site_favicon']
    );
    
    // Reset to default
    await db.execute(
      `INSERT INTO site_settings (setting_key, setting_value, file_path) 
       VALUES ('site_favicon', '', '/favicon.ico') 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), file_path = VALUES(file_path), updated_at = CURRENT_TIMESTAMP`
    );
    
    // Delete old favicon file if exists and it's not the default
    if (currentFavicon[0]?.file_path && currentFavicon[0].file_path !== '/favicon.ico') {
      const oldFilePath = path.join(__dirname, '..', currentFavicon[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    res.json({
      success: true,
      message: 'Favicon reset to default successfully'
    });
  } catch (error) {
    console.error('Error resetting favicon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset favicon'
    });
  }
});

module.exports = router;
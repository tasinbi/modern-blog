const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  images: 'uploads/images',
  logos: 'uploads/logos',
  favicons: 'uploads/favicons'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.images; // default
    
    // Determine upload path based on field name
    if (file.fieldname === 'logo') {
      uploadPath = uploadDirs.logos;
    } else if (file.fieldname === 'favicon') {
      uploadPath = uploadDirs.favicons;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Special naming for logo and favicon
    if (file.fieldname === 'logo') {
      cb(null, 'site-logo-' + uniqueSuffix + extension);
    } else if (file.fieldname === 'favicon') {
      cb(null, 'site-favicon-' + uniqueSuffix + extension);
    } else {
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  }
});

// File filter for images and favicon
const fileFilter = (req, file, cb) => {
  // Allow ICO files for favicon
  if (file.fieldname === 'favicon') {
    const allowedTypes = /jpeg|jpg|png|gif|webp|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/x-icon';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for favicon (jpeg, jpg, png, gif, webp, ico)'), false);
    }
  } else {
    // Regular image files for logo and blog images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (err.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

module.exports = {
  upload,
  handleUploadError
};
-- Site Settings Table for Logo, Favicon, and Other Site Configurations
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT,
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default values
INSERT INTO site_settings (setting_key, setting_value, file_path) VALUES
('site_logo', 'Banglay IELTS', NULL),
('site_favicon', '', '/favicon.ico'),
('site_title', 'Banglay IELTS - Your Trusted Partner for IELTS Success', NULL),
('site_description', 'Get expert IELTS preparation, tips, and guidance from Banglay IELTS. Your success is our mission.', NULL),
('theme_mode', 'light', NULL)
ON DUPLICATE KEY UPDATE
setting_value = VALUES(setting_value);
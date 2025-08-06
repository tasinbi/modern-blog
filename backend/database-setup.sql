-- Database setup for ModernBlog
-- Run this SQL script to set up your database

CREATE DATABASE IF NOT EXISTS new_blog_biic;
USE new_blog_biic;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author VARCHAR(100) NOT NULL,
  category_id INT,
  image VARCHAR(255),
  meta_keywords VARCHAR(500) DEFAULT NULL,
  meta_description TEXT DEFAULT NULL,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Insert sample admin user (password: admin123)
-- Note: In production, use a stronger password and hash it properly
INSERT INTO admins (username, password) VALUES 
('admin', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert sample categories
INSERT INTO categories (name) VALUES 
('Technology'),
('Programming'),
('Web Development'),
('Mobile Development'),
('Data Science'),
('Artificial Intelligence'),
('Cybersecurity'),
('Cloud Computing'),
('DevOps'),
('Tutorials');

-- Insert sample blog posts
INSERT INTO blogs (title, content, slug, author, category_id, meta_keywords, meta_description, views) VALUES 
(
  'শূন্য থেকে HTML শেখা: একটি সম্পূর্ণ গাইড', 
  '<p>HTML হল ওয়েব ডেভেলপমেন্টের ভিত্তি। এই টিউটোরিয়ালে আমরা HTML এর সব বেসিক থেকে অ্যাডভান্স বিষয় নিয়ে আলোচনা করব।</p><h2>HTML কি?</h2><p>HTML (HyperText Markup Language) একটি markup language যা ওয়েব পেজ তৈরি করতে ব্যবহৃত হয়।</p>', 
  'html-tutorial-bangla', 
  'রাহুল আহমেদ', 
  3, 
  'HTML Tutorial, Web Development, Bengali Tutorial',
  'HTML শেখার সম্পূর্ণ টিউটোরিয়াল বাংলায়। শূন্য থেকে HTML শিখুন।',
  1250
),
(
  'CSS দিয়ে Modern Web Design তৈরি করুন', 
  '<p>CSS3 এর নতুন ফিচারগুলো ব্যবহার করে আকর্ষণীয় ওয়েব ডিজাইন তৈরি করতে পারেন। এই পোস্টে CSS এর অ্যাডভান্স বিষয়গুলো নিয়ে আলোচনা করা হয়েছে।</p>', 
  'css-modern-web-design', 
  'সাকিব হাসান', 
  3, 
  'CSS, Web Design, Frontend',
  'CSS দিয়ে modern web design তৈরি করার টিপস এবং ট্রিকস।',
  980
),
(
  'JavaScript এর Complete Guide - ২০২৪', 
  '<p>JavaScript আজকের যুগে সবচেয়ে জনপ্রিয় প্রোগ্রামিং ভাষা। এই comprehensive guide এ JavaScript এর সব কিছু শিখতে পারবেন।</p>', 
  'javascript-complete-guide-2024', 
  'তানভীর রহমান', 
  3, 
  'JavaScript Tutorial, Programming, Web Development',
  'JavaScript এর সম্পূর্ণ গাইড ২০২৪। বেসিক থেকে অ্যাডভান্স JavaScript শিখুন।',
  2100
),
(
  'React.js দিয়ে Modern Web App তৈরি করুন', 
  '<p>React.js হল Facebook এর তৈরি একটি popular JavaScript library। এই টিউটোরিয়ালে React দিয়ে modern web application তৈরি করার পদ্ধতি শিখবেন।</p>', 
  'react-modern-web-app', 
  'নাদিয়া খান', 
  3, 
  'React.js, JavaScript, Web App Development',
  'React.js দিয়ে modern web application তৈরি করার complete tutorial।',
  1650
),
(
  'Node.js Backend Development শুরু করুন', 
  '<p>Node.js ব্যবহার করে powerful backend API তৈরি করতে পারেন। এই guide এ Node.js এর সব fundamental concepts নিয়ে আলোচনা করা হয়েছে।</p>', 
  'nodejs-backend-development', 
  'ফারহান আলী', 
  3, 
  'Node.js, Backend Development, API',
  'Node.js দিয়ে backend development শেখার complete guide।',
  1420
),
(
  'প্রোগ্রামিং ক্যারিয়ার শুরু করার গাইড', 
  '<p>প্রোগ্রামিং এ ক্যারিয়ার শুরু করতে চান? এই পোস্টে programming career এর জন্য প্রয়োজনীয় সব তথ্য দেওয়া হয়েছে।</p>', 
  'programming-career-guide', 
  'আরিফ হোসেন', 
  2, 
  'Programming Career, Job Tips, Developer Career',
  'প্রোগ্রামিং ক্যারিয়ার শুরু করার জন্য complete guideline।',
  3200
),
(
  'ডেটা সাইন্স শেখার সহজ উপায়', 
  '<p>Data Science আজকের যুগের সবচেয়ে ডিমান্ডিং skill। এই টিউটোরিয়ালে data science শেখার সহজ পদ্ধতি নিয়ে আলোচনা করা হয়েছে।</p>', 
  'data-science-bangla-tutorial', 
  'ড. সাদিয়া রহমান', 
  5, 
  'Data Science, Machine Learning, Python',
  'ডেটা সাইন্স শেখার complete roadmap এবং tutorial।',
  1780
),
(
  'AI এবং Machine Learning এর ভবিষ্যৎ', 
  '<p>Artificial Intelligence এবং Machine Learning এর দ্রুত বিকাশের সাথে সাথে আমাদের জীবনযাত্রা পরিবর্তিত হচ্ছে। এই আর্টিকেলে AI এর ভবিষ্যৎ নিয়ে আলোচনা করা হয়েছে।</p>', 
  'ai-machine-learning-future', 
  'প্রফেসর করিম উদ্দিন', 
  6, 
  'Artificial Intelligence, Machine Learning, Future Technology',
  'AI এবং Machine Learning এর ভবিষ্যৎ সম্ভাবনা নিয়ে বিস্তারিত আলোচনা।',
  2650
),
(
  'সাইবার সিকিউরিটি কেন গুরুত্বপূর্ণ?', 
  '<p>ডিজিটাল যুগে সাইবার সিকিউরিটি অত্যন্ত গুরুত্বপূর্ণ। এই পোস্টে cybersecurity এর বেসিক concepts এবং protection methods নিয়ে আলোচনা করা হয়েছে।</p>', 
  'cybersecurity-importance-bangla', 
  'আব্দুল্লাহ আল মামুন', 
  7, 
  'Cybersecurity, Internet Safety, Digital Security',
  'সাইবার সিকিউরিটির গুরুত্ব এবং নিরাপত্তার উপায়।',
  1340
),
(
  'ক্লাউড কম্পিউটিং এর সুবিধা ও অসুবিধা', 
  '<p>Cloud Computing আধুনিক ব্যবসার জন্য অত্যন্ত গুরুত্বপূর্ণ। এই আর্টিকেলে cloud computing এর benefits এবং challenges নিয়ে বিস্তারিত আলোচনা করা হয়েছে।</p>', 
  'cloud-computing-benefits-challenges', 
  'ইঞ্জিনিয়ার রাকিব', 
  8, 
  'Cloud Computing, AWS, Azure, Technology',
  'ক্লাউড কম্পিউটিং এর সুবিধা, অসুবিধা এবং ব্যবহারের নিয়ম।',
  890
),
(
  'DevOps কি এবং কেন শিখবেন?', 
  '<p>DevOps আধুনিক software development এর একটি গুরুত্বপূর্ণ অংশ। এই guide এ DevOps এর fundamentals এবং career opportunities নিয়ে আলোচনা করা হয়েছে।</p>', 
  'devops-guide-bangla', 
  'শাহিন আহমেদ', 
  9, 
  'DevOps, Automation, CI/CD, Docker',
  'DevOps কি, কেন শিখবেন এবং career এ এর গুরুত্ব।',
  1560
),
(
  'মোবাইল অ্যাপ ডেভেলপমেন্ট শুরু করুন', 
  '<p>Mobile App Development এ career শুরু করতে চান? এই comprehensive guide এ Android এবং iOS app development এর সব কিছু জানতে পারবেন।</p>', 
  'mobile-app-development-guide', 
  'তাসনিম জাহান', 
  4, 
  'Mobile App Development, Android, iOS, Flutter',
  'মোবাইল অ্যাপ ডেভেলপমেন্ট শেখার complete roadmap।',
  2300
);

-- Create indexes for better performance
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_category ON blogs(category_id);
CREATE INDEX idx_blogs_created ON blogs(created_at);
CREATE INDEX idx_categories_name ON categories(name);
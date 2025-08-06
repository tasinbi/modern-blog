#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up ModernBlog - Full Stack Blog Platform');
console.log('================================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
  console.error('❌ Node.js version 14 or higher is required');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Create environment files if they don't exist
const createEnvFile = (sourcePath, targetPath, replacements = {}) => {
  if (!fs.existsSync(targetPath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Apply replacements
    Object.keys(replacements).forEach(key => {
      content = content.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    fs.writeFileSync(targetPath, content);
    console.log(`✅ Created ${targetPath}`);
  } else {
    console.log(`⏭️  ${targetPath} already exists, skipping...`);
  }
};

// Create backend .env file
console.log('\n📁 Creating environment files...');
createEnvFile(
  'backend/env.example',
  'backend/.env',
  {
    'your_password': 'password123',
    'your_super_secret_jwt_key_here_make_it_long_and_random': 'blog_jwt_secret_key_2024_very_secure_key_change_in_production'
  }
);

// Create frontend .env file
const frontendEnvContent = `REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false`;

if (!fs.existsSync('frontend/.env')) {
  fs.writeFileSync('frontend/.env', frontendEnvContent);
  console.log('✅ Created frontend/.env');
} else {
  console.log('⏭️  frontend/.env already exists, skipping...');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\nInstalling backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('\nInstalling frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('\n✅ All dependencies installed successfully!');
} catch (error) {
  console.error('\n❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Create uploads directory
const uploadsDir = 'backend/uploads/images';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Display setup completion message
console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. Set up your MySQL database:');
console.log('   - Create a database named "new_blog_biic"');
console.log('   - Run the SQL script: backend/database-setup.sql');
console.log('   - Update database credentials in backend/.env if needed');
console.log('');
console.log('2. Start the development servers:');
console.log('   npm run dev');
console.log('');
console.log('3. Access the application:');
console.log('   - Frontend: http://localhost:3000');
console.log('   - Backend API: http://localhost:5000');
console.log('   - Admin Panel: http://localhost:3000/admin/login');
console.log('');
console.log('4. Default admin credentials:');
console.log('   - Username: admin');
console.log('   - Password: admin123');
console.log('');
console.log('🔧 Useful Commands:');
console.log('===================');
console.log('- npm run dev          # Start both frontend and backend');
console.log('- npm run server       # Start only backend');
console.log('- npm run client       # Start only frontend');
console.log('- npm run build        # Build frontend for production');
console.log('');
console.log('📚 Documentation: Check README.md for detailed information');
console.log('\n🚀 Happy coding!');
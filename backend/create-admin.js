const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'new_blog_biic',
      port: process.env.DB_PORT || 3306
    });

    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Delete existing admin user if exists
    await connection.execute('DELETE FROM admins WHERE username = ?', ['admin']);

    // Insert new admin user
    await connection.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      ['admin', hashedPassword]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📋 Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('🔑 Hashed password:', hashedPassword);

    await connection.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 Please run the database setup SQL script first!');
    }
  }
}

createAdmin();
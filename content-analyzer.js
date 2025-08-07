const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeContent() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blog_db'
  });

  console.log('🔍 Analyzing post content for issues...\n');

  try {
    // Get sample posts with potential issues
    const [rows] = await connection.execute(`
      SELECT id, title, content 
      FROM blogs 
      WHERE content LIKE '%&%' 
         OR content LIKE '%[%' 
         OR content LIKE '%<%' 
         OR content LIKE '%>%'
         OR content LIKE '%wp:%'
         OR content LIKE '%caption%'
      LIMIT 5
    `);

    console.log(`Found ${rows.length} posts with potential content issues:\n`);

    rows.forEach((row, index) => {
      console.log(`--- Post ${index + 1}: ${row.title.substring(0, 60)}... ---`);
      console.log(`ID: ${row.id}`);
      console.log('Sample content:');
      console.log(row.content.substring(0, 800) + '...\n');
      console.log('---\n');
    });

    // Count total problematic posts
    const [countRows] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM blogs 
      WHERE content LIKE '%&%' 
         OR content LIKE '%[%' 
         OR content LIKE '%<%' 
         OR content LIKE '%>%'
         OR content LIKE '%wp:%'
         OR content LIKE '%caption%'
    `);

    console.log(`📊 Total posts with content issues: ${countRows[0].count}`);

  } catch (error) {
    console.error('Error analyzing content:', error.message);
  } finally {
    await connection.end();
  }
}

analyzeContent();
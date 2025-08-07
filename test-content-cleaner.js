const ContentCleaner = require('./content-cleaner');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Sample problematic content (examples of common WordPress issues)
const problematicSamples = [
  // Sample 1: HTML entities and CSS
  `<style>.brutalist-button { left: -100%; } 100% { left: 100%; }</style>
   প্রতিটি প্যাসেজের জন্য সময় ভাগ করে নিন &lt;strong&gt;Time Management&lt;/strong&gt;
   ১. &amp; কিছু &quot;টিপস&quot; &#8211; এর সহজ উপায়`,

  // Sample 2: WordPress shortcodes
  `[caption id="attachment_123" align="aligncenter" width="300"]<img src="image.jpg" alt="IELTS Tips">[/caption]
   IELTS Reading এ ৮+ স্কোর করার জন্য [gallery ids="1,2,3"] এই টিপসগুলো ফলো করুন।
   [embed]https://youtube.com/watch?v=123[/embed]`,

  // Sample 3: Broken HTML and extra tags
  `<div class="content-wrapper" style="margin: 10px;"><span style="color: red;">
   <font face="Arial">IELTS Speaking টেস্টে</font></span> ভালো করতে হলে
   <p></p><p>&nbsp;</p><br><br><br>
   এই পদ্ধতিগুলো অনুসরণ করুন।</div>`,

  // Sample 4: Mixed content with entities and CSS
  `@keyframes slide { 0% { left: -100%; } 100% { left: 100%; } }
   .brut { transition: none; opacity: 0; }
   &lt;p&gt;IELTS টেস্ট ডেলিভারিতে পরিবর্তন!&lt;/p&gt;
   &amp;nbsp; কম্পিউটার বেইজড &amp;amp; পেপার বেইজড টেস্ট।`
];

async function testContentCleaner() {
  console.log('🧪 Testing Content Cleaner\n');
  console.log('=' * 50);

  const cleaner = new ContentCleaner();

  // Test with sample problematic content
  console.log('📝 Testing with sample problematic content:\n');
  
  problematicSamples.forEach((sample, index) => {
    console.log(`--- Sample ${index + 1} (Original) ---`);
    console.log(sample.substring(0, 200) + '...\n');
    
    const cleaned = cleaner.cleanContent(sample);
    console.log(`--- Sample ${index + 1} (Cleaned) ---`);
    console.log(cleaned);
    console.log('\n' + '='.repeat(50) + '\n');
  });

  // Test with real database content
  console.log('🗄️ Testing with real database content:\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blog_db'
    });

    const [rows] = await connection.execute(`
      SELECT id, title, content 
      FROM blogs 
      WHERE content LIKE '%&%' 
         OR content LIKE '%{%' 
         OR content LIKE '%}%'
      LIMIT 2
    `);

    rows.forEach((row, index) => {
      console.log(`--- Database Post ${index + 1}: ${row.title.substring(0, 40)}... ---`);
      console.log('Original content:');
      console.log(row.content.substring(0, 300) + '...\n');
      
      const cleaned = cleaner.cleanContent(row.content);
      console.log('Cleaned content:');
      console.log(cleaned.substring(0, 400) + '...\n');
      console.log('='.repeat(50) + '\n');
    });

    await connection.end();

  } catch (error) {
    console.error('Database test error:', error.message);
  }
}

// Run the test
testContentCleaner();
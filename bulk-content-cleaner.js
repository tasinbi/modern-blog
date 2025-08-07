const ContentCleaner = require('./content-cleaner');
const mysql = require('mysql2/promise');
require('dotenv').config();

class BulkContentCleaner {
  constructor() {
    this.cleaner = new ContentCleaner();
    this.connection = null;
    this.stats = {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  async connect() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blog_db'
    });
    console.log('✅ Connected to database');
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Database connection closed');
    }
  }

  async analyzePosts() {
    console.log('🔍 Analyzing posts for content issues...\n');

    const [totalRows] = await this.connection.execute('SELECT COUNT(*) as count FROM blogs');
    this.stats.total = totalRows[0].count;

    const [problematicRows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM blogs 
      WHERE content LIKE '%&%' 
         OR content LIKE '%{%' 
         OR content LIKE '%}%'
         OR content LIKE '%[%'
         OR content LIKE '%<%'
         OR content LIKE '%style%'
         OR content LIKE '%@keyframes%'
         OR LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) > LENGTH(content) * 0.5
    `);

    console.log(`📊 Analysis Results:`);
    console.log(`   Total posts: ${this.stats.total}`);
    console.log(`   Posts with content issues: ${problematicRows[0].count}`);
    console.log(`   Clean posts: ${this.stats.total - problematicRows[0].count}\n`);

    return problematicRows[0].count;
  }

  async cleanPost(id, title, content) {
    try {
      // Skip if content is already clean and short
      if (!content || content.length < 50) {
        this.stats.skipped++;
        return { success: true, skipped: true };
      }

      // Check if content has issues that need cleaning
      const hasIssues = content.includes('&') || 
                       content.includes('{') || 
                       content.includes('}') ||
                       content.includes('[') ||
                       content.includes('<') ||
                       content.includes('style') ||
                       content.includes('@keyframes');

      if (!hasIssues && content.startsWith('<p>') && content.endsWith('</p>')) {
        this.stats.skipped++;
        return { success: true, skipped: true };
      }

      // Clean the content
      const cleanedContent = this.cleaner.cleanContent(content);

      // Update database
      await this.connection.execute(
        'UPDATE blogs SET content = ?, updated_at = NOW() WHERE id = ?',
        [cleanedContent, id]
      );

      this.stats.success++;
      return { 
        success: true, 
        cleaned: true,
        originalLength: content.length,
        cleanedLength: cleanedContent.length
      };

    } catch (error) {
      this.stats.failed++;
      console.error(`❌ Failed to clean post ${id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async processAllPosts() {
    console.log('🧹 Starting bulk content cleaning...\n');

    try {
      // Get all posts
      const [posts] = await this.connection.execute(
        'SELECT id, title, content FROM blogs ORDER BY id'
      );

      console.log(`Processing ${posts.length} posts...\n`);

      // Process posts in batches of 10
      const batchSize = 10;
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (post) => {
          const result = await this.cleanPost(post.id, post.title, post.content);
          this.stats.processed++;

          if (result.cleaned) {
            console.log(`✅ Cleaned post ${post.id}: ${post.title.substring(0, 50)}...`);
          } else if (result.skipped) {
            console.log(`⏭️  Skipped post ${post.id}: ${post.title.substring(0, 50)}... (already clean)`);
          }

          // Progress indicator
          if (this.stats.processed % 20 === 0) {
            console.log(`\n📊 Progress: ${this.stats.processed}/${posts.length} posts processed\n`);
          }
        }));
      }

    } catch (error) {
      console.error('❌ Error processing posts:', error.message);
      throw error;
    }
  }

  async verifyResults() {
    console.log('\n🔍 Verifying cleaning results...\n');

    try {
      // Check for remaining issues
      const [remaining] = await this.connection.execute(`
        SELECT COUNT(*) as count 
        FROM blogs 
        WHERE content LIKE '%@keyframes%'
           OR content LIKE '%style=%'
           OR content LIKE '%{%'
           OR content LIKE '%}%'
           OR content LIKE '%[caption%'
           OR content LIKE '%[gallery%'
      `);

      console.log(`📊 Verification Results:`);
      console.log(`   Posts with remaining issues: ${remaining[0].count}`);

      // Sample some cleaned content
      const [samples] = await this.connection.execute(`
        SELECT id, title, content 
        FROM blogs 
        WHERE updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        LIMIT 3
      `);

      console.log(`\n📄 Sample cleaned content:\n`);
      samples.forEach((post, index) => {
        console.log(`--- Sample ${index + 1}: ${post.title.substring(0, 50)}... ---`);
        console.log(post.content.substring(0, 200) + '...\n');
      });

    } catch (error) {
      console.error('❌ Error during verification:', error.message);
    }
  }

  async run() {
    console.log('🚀 Bulk Content Cleaning Tool');
    console.log('==============================\n');

    try {
      await this.connect();
      
      const problematicCount = await this.analyzePosts();
      
      if (problematicCount === 0) {
        console.log('✅ All posts appear to be clean already!');
        return;
      }

      // Confirm before proceeding
      console.log('⚠️  This will modify your database content.');
      console.log('🔄 Proceeding with bulk cleaning...\n');

      await this.processAllPosts();
      await this.verifyResults();

      console.log('\n🎉 Bulk content cleaning completed!');
      console.log(`\n📊 Final Statistics:`);
      console.log(`   Total posts: ${this.stats.total}`);
      console.log(`   Processed: ${this.stats.processed}`);
      console.log(`   Successfully cleaned: ${this.stats.success}`);
      console.log(`   Skipped (already clean): ${this.stats.skipped}`);
      console.log(`   Failed: ${this.stats.failed}`);

      if (this.stats.failed > 0) {
        console.log('\n⚠️  Some posts failed to clean. Check the error messages above.');
      } else {
        console.log('\n✅ All posts processed successfully!');
      }

    } catch (error) {
      console.error('\n💥 Bulk cleaning failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Create a simple function for one-time content cleaning
async function cleanSingleContent(content) {
  const cleaner = new ContentCleaner();
  return cleaner.cleanContent(content);
}

// Export for programmatic use
module.exports = { BulkContentCleaner, cleanSingleContent };

// Run if script is executed directly
if (require.main === module) {
  const bulkCleaner = new BulkContentCleaner();
  bulkCleaner.run();
}
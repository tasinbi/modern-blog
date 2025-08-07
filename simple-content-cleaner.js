const mysql = require('mysql2/promise');
require('dotenv').config();

class SimpleContentCleaner {
  constructor() {
    this.connection = null;
  }

  // Connect to database
  async connectDatabase() {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blog_db'
      });
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  // Clean content function
  cleanContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    console.log('🧹 Starting content cleaning...');
    let cleaned = content;

    // Step 1: Decode HTML entities
    console.log('   Step 1: Decoding HTML entities...');
    const htmlEntities = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#039;': "'",
      '&#8217;': "'", // Right single quotation mark
      '&#8216;': "'", // Left single quotation mark  
      '&#8220;': '"', // Left double quotation mark
      '&#8221;': '"', // Right double quotation mark
      '&#8211;': '–', // En dash
      '&#8212;': '—', // Em dash
      '&#8230;': '…', // Horizontal ellipsis
      '&nbsp;': ' ',
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–'
    };

    for (const [entity, replacement] of Object.entries(htmlEntities)) {
      cleaned = cleaned.replace(new RegExp(entity, 'g'), replacement);
    }

    // Handle numeric entities
    cleaned = cleaned.replace(/&#(\d+);/g, (match, num) => {
      return String.fromCharCode(parseInt(num, 10));
    });

    // Step 2: Remove WordPress shortcodes
    console.log('   Step 2: Removing WordPress shortcodes...');
    const shortcodePatterns = [
      /\[caption[^\]]*\][\s\S]*?\[\/caption\]/gi,
      /\[gallery[^\]]*\]/gi,
      /\[audio[^\]]*\]/gi,
      /\[video[^\]]*\]/gi,
      /\[embed[^\]]*\][\s\S]*?\[\/embed\]/gi,
      /\[contact-form-7[^\]]*\]/gi,
      /\[elementor-template[^\]]*\]/gi,
      /\[[a-zA-Z_][a-zA-Z0-9_-]*[^\]]*\]/g // Generic shortcode pattern
    ];

    shortcodePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Step 3: Remove dangerous tags
    console.log('   Step 3: Removing dangerous content...');
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Step 4: Clean WordPress specific classes and attributes
    console.log('   Step 4: Cleaning WordPress artifacts...');
    const wpClassPatterns = [
      /class="[^"]*wp-image-\d+[^"]*"/gi,
      /class="[^"]*alignleft[^"]*"/gi,
      /class="[^"]*alignright[^"]*"/gi,
      /class="[^"]*aligncenter[^"]*"/gi,
      /class="[^"]*wp-caption[^"]*"/gi,
      /class="[^"]*attachment-[^"]*"/gi,
      /class="[^"]*size-[^"]*"/gi,
      /srcset="[^"]*"/gi,
      /sizes="[^"]*"/gi
    ];

    wpClassPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Clean empty class attributes
    cleaned = cleaned.replace(/\s+class=""\s*/g, ' ');

    // Step 5: Fix common HTML issues
    console.log('   Step 5: Fixing HTML formatting...');
    cleaned = cleaned
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single space
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br/><br/>') // Fix double line breaks
      .replace(/<(p|div|span)[^>]*>\s*<\/\1>/gi, '') // Remove empty elements
      .trim();

    // Step 6: Ensure proper HTML structure
    console.log('   Step 6: Ensuring proper HTML structure...');
    
    // If content doesn't start with a block element, wrap in paragraph
    if (cleaned && !cleaned.match(/^<(p|h[1-6]|div|ul|ol|blockquote|section|article)/i)) {
      cleaned = `<p>${cleaned}</p>`;
    }

    console.log('✅ Content cleaning completed');
    return cleaned;
  }

  // Demonstrate cleaning
  demonstrateClean() {
    console.log('🧹 Content Cleaning Demonstration');
    console.log('='.repeat(60));

    const problematicContent = `&lt;div class="wp-caption alignleft"&gt;
        &lt;img src="http://example.com/wp-content/uploads/2023/01/image.jpg" 
             class="wp-image-123 size-medium" 
             srcset="image-300x200.jpg 300w, image-768x512.jpg 768w" 
             alt="Sample &amp; Test Image"&gt;
        &lt;p class="wp-caption-text"&gt;This is a caption with &quot;quotes&quot; and &amp; symbols.&lt;/p&gt;
      &lt;/div&gt;
      
      [caption id="attachment_456" align="alignright" width="300"]
      &lt;img src="http://example.com/image2.jpg" alt="Another Image"&gt; 
      Another caption with [gallery ids="1,2,3"]
      [/caption]
      
      &lt;p&gt;This is a paragraph with &lt;strong&gt;bold text&lt;/strong&gt; and &lt;em&gt;italic text&lt;/em&gt;.
      It has some &amp;nbsp; extra spaces and &#8220;smart quotes&#8221;.&lt;/p&gt;
      
      &lt;script&gt;alert('dangerous');&lt;/script&gt;
      
      &lt;h2 class="post-title-123"&gt;IELTS Writing Tips&lt;/h2&gt;
      &lt;p&gt;Some content about IELTS preparation and strategies for success.&lt;/p&gt;`;

    console.log('\n🔧 BEFORE CLEANING:');
    console.log('-'.repeat(40));
    console.log(problematicContent);

    const cleaned = this.cleanContent(problematicContent);

    console.log('\n✨ AFTER CLEANING:');
    console.log('-'.repeat(40));
    console.log(cleaned);

    console.log('\n📋 Explanation of Changes:');
    console.log('• HTML entities (&lt;, &gt;, &amp;, etc.) → Decoded to proper characters');
    console.log('• WordPress shortcodes [caption], [gallery] → Removed');
    console.log('• Dangerous <script> tags → Removed for security');
    console.log('• WordPress CSS classes (wp-image-*, alignleft, etc.) → Removed');
    console.log('• Malformed HTML and extra whitespace → Fixed');
    console.log('• Content structure → Preserved and cleaned');

    return cleaned;
  }

  // Clean all posts in database
  async cleanAllPosts() {
    console.log('🧹 Starting bulk content cleaning for all blog posts...');

    try {
      // Get all posts
      const [posts] = await this.connection.execute(
        'SELECT id, title, content FROM blogs WHERE content IS NOT NULL AND content != "" ORDER BY id'
      );

      console.log(`📄 Found ${posts.length} posts to clean`);

      let cleanedCount = 0;
      let unchangedCount = 0;
      let failedCount = 0;

      for (const post of posts) {
        try {
          const originalContent = post.content;
          const cleanedContent = this.cleanContent(originalContent);

          // Only update if content actually changed and is not empty
          if (cleanedContent !== originalContent && cleanedContent.trim().length > 0) {
            await this.connection.execute(
              'UPDATE blogs SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [cleanedContent, post.id]
            );

            cleanedCount++;
            console.log(`   ✓ Cleaned post ${post.id}: "${post.title.substring(0, 40)}..."`);
          } else {
            unchangedCount++;
          }

        } catch (error) {
          failedCount++;
          console.log(`   ❌ Failed to clean post ${post.id}: ${error.message}`);
        }
      }

      console.log('\n📊 Cleaning Results:');
      console.log(`   📝 Total posts processed: ${posts.length}`);
      console.log(`   ✅ Posts cleaned: ${cleanedCount}`);
      console.log(`   ➖ Posts unchanged: ${unchangedCount}`);
      console.log(`   ❌ Posts failed: ${failedCount}`);

      return { total: posts.length, cleaned: cleanedCount, unchanged: unchangedCount, failed: failedCount };

    } catch (error) {
      console.error('❌ Error during bulk cleaning:', error.message);
      throw error;
    }
  }

  // Main execution
  async run(mode = 'clean') {
    console.log('🚀 Simple Content Cleaner Started');
    console.log('='.repeat(40));

    try {
      if (mode === 'demo') {
        this.demonstrateClean();
        return;
      }

      await this.connectDatabase();
      const results = await this.cleanAllPosts();

      console.log('\n🎉 Content cleaning completed successfully!');
      console.log('💡 Your blog posts now have clean, properly formatted HTML');
      console.log('🌐 Refresh your website to see the improved content display');

    } catch (error) {
      console.error('\n💥 Cleaning failed:', error.message);
      process.exit(1);
    } finally {
      if (this.connection) {
        await this.connection.end();
        console.log('✅ Database connection closed');
      }
    }
  }
}

// Standalone function for cleaning single content
function cleanSingleContent(content) {
  const cleaner = new SimpleContentCleaner();
  return cleaner.cleanContent(content);
}

module.exports = SimpleContentCleaner;
module.exports.cleanSingleContent = cleanSingleContent;

// Run if called directly
if (require.main === module) {
  const mode = process.argv[2] || 'clean'; // 'clean' or 'demo'
  const cleaner = new SimpleContentCleaner();
  cleaner.run(mode);
}
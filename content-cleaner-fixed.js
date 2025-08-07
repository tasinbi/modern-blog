const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class ContentCleaner {
  constructor() {
    this.connection = null;
    this.cleaningStats = {
      total: 0,
      cleaned: 0,
      failed: 0,
      issues_found: {
        html_entities: 0,
        shortcodes: 0,
        malformed_html: 0,
        script_tags: 0,
        wordpress_artifacts: 0
      }
    };
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

  // Decode HTML entities
  decodeHtmlEntities(content) {
    if (!content) return '';

    let decoded = content;

    // Common HTML entities
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&#8217;': "'",
      '&#8216;': "'",
      '&#8220;': '"',
      '&#8221;': '"',
      '&#8211;': '–',
      '&#8212;': '—',
      '&#8230;': '…',
      '&nbsp;': ' ',
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&bull;': '•',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };

    // Replace entities
    for (const [entity, replacement] of Object.entries(entities)) {
      if (decoded.includes(entity)) {
        this.cleaningStats.issues_found.html_entities++;
        decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
      }
    }

    // Handle numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      this.cleaningStats.issues_found.html_entities++;
      return String.fromCharCode(parseInt(num, 10));
    });

    return decoded;
  }

  // Remove WordPress shortcodes
  removeShortcodes(content) {
    if (!content) return '';

    let cleaned = content;

    // Common WordPress shortcodes
    const shortcodes = [
      /\[caption[^\]]*\][\s\S]*?\[\/caption\]/gi,
      /\[gallery[^\]]*\]/gi,
      /\[audio[^\]]*\]/gi,
      /\[video[^\]]*\]/gi,
      /\[embed[^\]]*\][\s\S]*?\[\/embed\]/gi,
      /\[contact-form-7[^\]]*\]/gi,
      /\[elementor-template[^\]]*\]/gi
    ];

    shortcodes.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        this.cleaningStats.issues_found.shortcodes += matches.length;
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }

  // Remove dangerous content
  removeDangerousContent(content) {
    if (!content) return '';

    let cleaned = content;

    // Remove script tags
    const scriptMatches = cleaned.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi);
    if (scriptMatches) {
      this.cleaningStats.issues_found.script_tags += scriptMatches.length;
      cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Remove style tags
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove other dangerous tags
    cleaned = cleaned.replace(/<(iframe|object|embed|form)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

    return cleaned;
  }

  // Clean WordPress artifacts
  cleanWordPressArtifacts(content) {
    if (!content) return '';

    let cleaned = content;

    // WordPress specific classes and attributes
    const wpPatterns = [
      /class="[^"]*wp-image-\d+[^"]*"/gi,
      /class="[^"]*alignleft[^"]*"/gi,
      /class="[^"]*alignright[^"]*"/gi,
      /class="[^"]*aligncenter[^"]*"/gi,
      /class="[^"]*wp-caption[^"]*"/gi,
      /class="[^"]*post-\d+[^"]*"/gi,
      /srcset="[^"]*"/gi,
      /sizes="[^"]*"/gi
    ];

    wpPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        this.cleaningStats.issues_found.wordpress_artifacts += matches.length;
        cleaned = cleaned.replace(pattern, '');
      }
    });

    // Clean empty attributes
    cleaned = cleaned.replace(/\s+class=""\s*/g, ' ');
    cleaned = cleaned.replace(/\s+id=""\s*/g, ' ');

    return cleaned;
  }

  // Fix malformed HTML
  fixMalformedHtml(content) {
    if (!content) return '';

    let fixed = content;
    const originalLength = fixed.length;

    // Fix common HTML issues
    fixed = fixed
      // Remove broken tags
      .replace(/<[^>]*(?!>)/g, '')
      .replace(/(?<!<)[^<]*>/g, '')
      // Fix multiple spaces
      .replace(/\s{2,}/g, ' ')
      // Fix line breaks
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br/><br/>')
      // Remove empty elements
      .replace(/<(p|div|span)[^>]*>\s*<\/\1>/gi, '')
      // Fix image tags
      .replace(/<img([^>]*?)(?:\s*\/)?>/gi, '<img$1/>')
      // Clean whitespace around tags
      .replace(/>\s+</g, '><')
      .trim();

    if (fixed.length !== originalLength) {
      this.cleaningStats.issues_found.malformed_html++;
    }

    return fixed;
  }

  // Convert to clean HTML
  convertToCleanHtml(content) {
    if (!content) return '';

    let clean = content;

    // Convert formatting tags
    clean = clean
      .replace(/<b\b[^>]*>/gi, '<strong>')
      .replace(/<\/b>/gi, '</strong>')
      .replace(/<i\b[^>]*>/gi, '<em>')
      .replace(/<\/i>/gi, '</em>')
      .replace(/<u\b[^>]*>/gi, '<em>')
      .replace(/<\/u>/gi, '</em>');

    // Clean attributes from common tags, keep only essential ones
    clean = clean.replace(/<(h[1-6])\b[^>]*>/gi, '<$1>');
    clean = clean.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1">');
    clean = clean.replace(/<img\s+[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/gi, (match, src, alt) => {
      return `<img src="${src}"${alt ? ` alt="${alt}"` : ''} />`;
    });

    return clean;
  }

  // Main cleaning function
  cleanContent(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
      return '';
    }

    let cleaned = rawContent;

    console.log('Step 1: Decode HTML entities...');
    cleaned = this.decodeHtmlEntities(cleaned);

    console.log('Step 2: Remove shortcodes...');
    cleaned = this.removeShortcodes(cleaned);

    console.log('Step 3: Remove dangerous content...');
    cleaned = this.removeDangerousContent(cleaned);

    console.log('Step 4: Clean WordPress artifacts...');
    cleaned = this.cleanWordPressArtifacts(cleaned);

    console.log('Step 5: Fix malformed HTML...');
    cleaned = this.fixMalformedHtml(cleaned);

    console.log('Step 6: Convert to clean HTML...');
    cleaned = this.convertToCleanHtml(cleaned);

    // Final cleanup
    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    // Wrap in paragraph if not already structured
    if (cleaned && !cleaned.match(/^<(p|h[1-6]|div|ul|ol|blockquote)/i)) {
      cleaned = `<p>${cleaned}</p>`;
    }

    return cleaned;
  }

  // Demonstrate cleaning with sample content
  demonstrateClean() {
    console.log('🧹 Content Cleaning Demonstration');
    console.log('='.repeat(50));

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
      &lt;p&gt;Some content about IELTS...&lt;/p&gt;`;

    console.log('\n🔧 BEFORE CLEANING:');
    console.log(problematicContent);

    console.log('\n🧹 CLEANING PROCESS:');
    const cleaned = this.cleanContent(problematicContent);

    console.log('\n✨ AFTER CLEANING:');
    console.log('='.repeat(50));
    console.log(cleaned);

    console.log('\n📊 Issues Found & Fixed:');
    Object.entries(this.cleaningStats.issues_found).forEach(([issue, count]) => {
      if (count > 0) {
        console.log(`   ${issue.replace(/_/g, ' ')}: ${count}`);
      }
    });

    return cleaned;
  }

  // Clean all posts in database
  async cleanAllPosts() {
    console.log('🧹 Starting bulk content cleaning...');

    try {
      const [posts] = await this.connection.execute(
        'SELECT id, title, content FROM blogs WHERE content IS NOT NULL ORDER BY id'
      );

      this.cleaningStats.total = posts.length;
      console.log(`📄 Found ${posts.length} posts to clean`);

      for (const post of posts) {
        try {
          const originalContent = post.content;
          const cleanedContent = this.cleanContent(originalContent);

          if (cleanedContent !== originalContent && cleanedContent.length > 0) {
            await this.connection.execute(
              'UPDATE blogs SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [cleanedContent, post.id]
            );

            this.cleaningStats.cleaned++;
            console.log(`   ✓ Cleaned post ${post.id}: "${post.title.substring(0, 50)}..."`);
          }

        } catch (error) {
          this.cleaningStats.failed++;
          console.log(`   ❌ Failed to clean post ${post.id}: ${error.message}`);
        }
      }

      console.log('\n📊 Cleaning Results:');
      console.log(`   Total posts: ${this.cleaningStats.total}`);
      console.log(`   Posts cleaned: ${this.cleaningStats.cleaned}`);
      console.log(`   Posts failed: ${this.cleaningStats.failed}`);
      console.log(`   Posts unchanged: ${this.cleaningStats.total - this.cleaningStats.cleaned - this.cleaningStats.failed}`);

    } catch (error) {
      console.error('❌ Error during bulk cleaning:', error.message);
      throw error;
    }
  }

  // Main execution
  async run(mode = 'clean') {
    console.log('🚀 Content Cleaner Started');
    console.log('='.repeat(30));

    try {
      if (mode === 'demo') {
        this.demonstrateClean();
        return;
      }

      await this.connectDatabase();
      await this.cleanAllPosts();

      console.log('\n🎉 Content cleaning completed successfully!');

    } catch (error) {
      console.error('\n💥 Cleaning failed:', error.message);
      process.exit(1);
    } finally {
      if (this.connection) {
        await this.connection.end();
      }
    }
  }
}

// Standalone function for cleaning single content
function cleanSingleContent(content) {
  const cleaner = new ContentCleaner();
  return cleaner.cleanContent(content);
}

module.exports = ContentCleaner;
module.exports.cleanSingleContent = cleanSingleContent;

// Run if called directly
if (require.main === module) {
  const mode = process.argv[2] || 'clean';
  const cleaner = new ContentCleaner();
  cleaner.run(mode);
}
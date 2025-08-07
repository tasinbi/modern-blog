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

    const entityMap = {
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
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&bull;': '•',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&deg;': '°',
      '&plusmn;': '±',
      '&frac14;': '¼',
      '&frac12;': '½',
      '&frac34;': '¾'
    };

    let decoded = content;
    
    // Replace known entities
    Object.entries(entityMap).forEach(([entity, replacement]) => {
      const regex = new RegExp(entity, 'g');
      if (decoded.includes(entity)) {
        this.cleaningStats.issues_found.html_entities++;
        decoded = decoded.replace(regex, replacement);
      }
    });

    // Handle numeric entities like &#123;
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      this.cleaningStats.issues_found.html_entities++;
      return String.fromCharCode(parseInt(num, 10));
    });

    // Handle hex entities like &#x1F;
    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      this.cleaningStats.issues_found.html_entities++;
      return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
  }

  // Remove WordPress shortcodes
  removeShortcodes(content) {
    if (!content) return '';

    const shortcodePatterns = [
      // Standard shortcodes with content: [shortcode]content[/shortcode]
      /\[\/?(caption|gallery|audio|video|playlist|embed|wp_caption|contact-form-7|gravityform|wpforms|elementor-template|et_pb_section|et_pb_row|et_pb_column|et_pb_text|vc_row|vc_column|vc_column_text)\b[^\]]*\][\s\S]*?\[\/\1\]/gi,
      
      // Self-closing shortcodes: [shortcode attribute="value"]
      /\[(caption|gallery|audio|video|playlist|embed|wp_caption|contact-form-7|gravityform|wpforms|elementor-template|et_pb_section|et_pb_row|et_pb_column|et_pb_text|vc_row|vc_column|vc_column_text|soundcloud|youtube|vimeo|instagram|twitter|facebook)\b[^\]]*\]/gi,
      
      // Generic shortcode pattern for unknown shortcodes
      /\[[a-zA-Z_][a-zA-Z0-9_-]*(\s+[^[\]]*?)?\]/g,
      
      // Closing shortcode tags
      /\[\/[a-zA-Z_][a-zA-Z0-9_-]*\]/g
    ];

    let cleaned = content;
    
    shortcodePatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        this.cleaningStats.issues_found.shortcodes += matches.length;
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }

  // Remove dangerous and unnecessary tags
  removeDangerousTags(content) {
    if (!content) return '';

    const dangerousPatterns = [
      // Remove script tags completely
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      
      // Remove style tags but keep content for manual review
      /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
      
      // Remove iframe tags (keep src for manual review if needed)
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      
      // Remove object and embed tags
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^>]*>/gi,
      
      // Remove form tags (WordPress contact forms, etc.)
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
      
      // Remove input, button, select tags
      /<(input|button|select|textarea)\b[^>]*>/gi,
      /<\/(select|textarea)>/gi,
      
      // Remove meta tags
      /<meta\b[^>]*>/gi,
      
      // Remove link tags (except for content links)
      /<link\b[^>]*>/gi,
      
      // Remove WordPress specific comments
      /<!--[\s\S]*?-->/g
    ];

    let cleaned = content;
    
    dangerousPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        this.cleaningStats.issues_found.script_tags += matches.length;
        cleaned = cleaned.replace(pattern, '');
      }
    });

    return cleaned;
  }

  // Fix malformed HTML tags
  fixMalformedHtml(content) {
    if (!content) return '';

    let fixed = content;

    // Fix unclosed tags by removing orphaned closing tags
    const orphanedClosingTags = /<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g;
    const openingTags = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    
    // Track which tags are opened
    const openTags = [];
    let match;
    
    // Find all opening tags
    while ((match = openingTags.exec(content)) !== null) {
      const tagName = match[1].toLowerCase();
      // Skip self-closing tags
      if (!['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName)) {
        openTags.push(tagName);
      }
    }

    // Fix common HTML issues
    fixed = fixed
      // Remove broken or incomplete tags like <div or >
      .replace(/<[^>]*(?!>)/g, '')
      .replace(/(?<!<)[^<]*>/g, '')
      
      // Fix multiple consecutive spaces
      .replace(/\s{2,}/g, ' ')
      
      // Fix broken line breaks
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br/><br/>')
      
      // Fix paragraph spacing
      .replace(/<\/p>\s*<p>/gi, '</p><p>')
      
      // Remove empty paragraphs
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      
      // Fix heading tags
      .replace(/<(h[1-6])[^>]*>\s*<\/\1>/gi, '')
      
      // Remove empty divs
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      
      // Fix image tags
      .replace(/<img([^>]*?)(?:\s*\/)?>/gi, '<img$1/>')
      
      // Clean up extra whitespace around tags
      .replace(/>\s+</g, '><')
      .trim();

    if (fixed !== content) {
      this.cleaningStats.issues_found.malformed_html++;
    }

    return fixed;
  }

  // Remove WordPress-specific artifacts
  removeWordPressArtifacts(content) {
    if (!content) return '';

    const wpPatterns = [
      // WordPress image classes and attributes
      /class="[^"]*wp-image-\d+[^"]*"/gi,
      /class="[^"]*alignleft[^"]*"/gi,
      /class="[^"]*alignright[^"]*"/gi,
      /class="[^"]*aligncenter[^"]*"/gi,
      /class="[^"]*alignnone[^"]*"/gi,
      /class="[^"]*attachment-[^"]*"/gi,
      /class="[^"]*size-[^"]*"/gi,
      
      // WordPress specific div classes
      /class="[^"]*wp-caption[^"]*"/gi,
      /class="[^"]*wp-caption-text[^"]*"/gi,
      
      // WordPress gallery and attachment URLs
      /https?:\/\/[^\/\s]+\/wp-content\/uploads\/\d{4}\/\d{2}\/[^\s"'>]+/gi,
      
      // WordPress media queries and srcset
      /srcset="[^"]*"/gi,
      /sizes="[^"]*"/gi,
      
      // WordPress specific IDs
      /id="attachment_\d+"/gi,
      
      // More WordPress classes
      /class="[^"]*post-\d+[^"]*"/gi,
      /class="[^"]*page-id-\d+[^"]*"/gi
    ];

    let cleaned = content;
    
    wpPatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        this.cleaningStats.issues_found.wordpress_artifacts += matches.length;
        cleaned = cleaned.replace(pattern, '');
      }
    });

    // Clean up empty class attributes
    cleaned = cleaned.replace(/\s*class=""\s*/g, ' ');
    cleaned = cleaned.replace(/\s*id=""\s*/g, ' ');

    return cleaned;
  }

  // Convert to clean, semantic HTML
  convertToSemanticHtml(content) {
    if (!content) return '';

    let semantic = content;

    // Convert common formatting to semantic HTML
    semantic = semantic
      // Convert bold text
      .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '<strong>$1</strong>')
      
      // Convert italic text
      .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '<em>$1</em>')
      
      // Convert underline to emphasis (underline is not semantic)
      .replace(/<u\b[^>]*>(.*?)<\/u>/gi, '<em>$1</em>')
      
      // Ensure proper paragraph structure
      .replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p>')
      
      // Fix heading hierarchy (ensure proper nesting)
      .replace(/<h([1-6])\b[^>]*>/gi, (match, level) => `<h${level}>`)
      
      // Clean up link attributes, keep only href
      .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1">')
      
      // Clean up image attributes, keep only src and alt
      .replace(/<img\s+[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/gi, (match, src, alt) => {
        return `<img src="${src}"${alt ? ` alt="${alt}"` : ''} />`;
      });

    return semantic;
  }

  // Main cleaning function
  cleanContent(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
      return '';
    }

    console.log('🧹 Cleaning content...');
    
    let cleaned = rawContent;

    // Step 1: Decode HTML entities
    cleaned = this.decodeHtmlEntities(cleaned);
    
    // Step 2: Remove WordPress shortcodes
    cleaned = this.removeShortcodes(cleaned);
    
    // Step 3: Remove dangerous tags
    cleaned = this.removeDangerousTags(cleaned);
    
    // Step 4: Fix malformed HTML
    cleaned = this.fixMalformedHtml(cleaned);
    
    // Step 5: Remove WordPress artifacts
    cleaned = this.removeWordPressArtifacts(cleaned);
    
    // Step 6: Convert to semantic HTML
    cleaned = this.convertToSemanticHtml(cleaned);
    
    // Final cleanup
    cleaned = cleaned
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/>\s+</g, '><')  // Remove whitespace between tags
      .trim();

    // Wrap in paragraphs if not already wrapped
    if (cleaned && !cleaned.match(/^<(p|h[1-6]|div|ul|ol|blockquote)/i)) {
      cleaned = `<p>${cleaned}</p>`;
    }

    return cleaned;
  }

  // Sample content for demonstration
  demonstrateClean() {
    const problematicContent = `
      &lt;div class="wp-caption alignleft"&gt;
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
      
      &lt;div&gt;&lt;br&gt;&lt;br&gt;&lt;/div&gt;
      
      &lt;h2 class="post-title-123"&gt;IELTS Writing Tips&lt;/h2&gt;
      &lt;p&gt;Some content about IELTS...&lt;/p&gt;
    `;

    console.log('🔧 BEFORE CLEANING:');
    console.log('='.repeat(50));
    console.log(problematicContent.trim());
    
    const cleaned = this.cleanContent(problematicContent);
    
    console.log('\n✨ AFTER CLEANING:');
    console.log('='.repeat(50));
    console.log(cleaned);
    
    console.log('\n📊 Issues Found:');
    console.log(`HTML Entities: ${this.cleaningStats.issues_found.html_entities}`);
    console.log(`Shortcodes: ${this.cleaningStats.issues_found.shortcodes}`);
    console.log(`Script Tags: ${this.cleaningStats.issues_found.script_tags}`);
    console.log(`WordPress Artifacts: ${this.cleaningStats.issues_found.wordpress_artifacts}`);
    console.log(`Malformed HTML: ${this.cleaningStats.issues_found.malformed_html}`);
    
    return cleaned;
  }

  // Update all posts in database
  async cleanAllPosts() {
    console.log('🧹 Starting bulk content cleaning...');
    
    try {
      // Get all posts
      const [posts] = await this.connection.execute(
        'SELECT id, title, content FROM blogs ORDER BY id'
      );

      this.cleaningStats.total = posts.length;
      console.log(`📄 Found ${posts.length} posts to clean`);

      for (const post of posts) {
        try {
          const originalContent = post.content;
          const cleanedContent = this.cleanContent(originalContent);
          
          // Only update if content changed
          if (cleanedContent !== originalContent) {
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

      this.printCleaningStats();
      
    } catch (error) {
      console.error('❌ Error during bulk cleaning:', error.message);
      throw error;
    }
  }

  // Print cleaning statistics
  printCleaningStats() {
    console.log('\n📊 Cleaning Statistics:');
    console.log('='.repeat(40));
    console.log(`Total posts: ${this.cleaningStats.total}`);
    console.log(`Posts cleaned: ${this.cleaningStats.cleaned}`);
    console.log(`Posts failed: ${this.cleaningStats.failed}`);
    console.log(`Posts unchanged: ${this.cleaningStats.total - this.cleaningStats.cleaned - this.cleaningStats.failed}`);
    
    console.log('\n🔍 Issues Found & Fixed:');
    Object.entries(this.cleaningStats.issues_found).forEach(([issue, count]) => {
      if (count > 0) {
        console.log(`   ${issue.replace(/_/g, ' ')}: ${count}`);
      }
    });
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
      console.log('💡 Your blog posts now have clean, semantic HTML');
      
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

// Export for use as module
module.exports = ContentCleaner;

// Standalone function for single content cleaning
function cleanSingleContent(content) {
  const cleaner = new ContentCleaner();
  return cleaner.cleanContent(content);
}

// Export standalone function
module.exports.cleanSingleContent = cleanSingleContent;

// Run if called directly
if (require.main === module) {
  const mode = process.argv[2] || 'clean'; // 'clean' or 'demo'
  const cleaner = new ContentCleaner();
  cleaner.run(mode);
}
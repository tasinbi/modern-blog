const he = require('he'); // For HTML entity decoding

class ContentCleaner {
  constructor() {
    // WordPress shortcode patterns
    this.shortcodePatterns = [
      /\[caption[^\]]*\][\s\S]*?\[\/caption\]/gi,
      /\[gallery[^\]]*\]/gi,
      /\[embed[^\]]*\][\s\S]*?\[\/embed\]/gi,
      /\[video[^\]]*\]/gi,
      /\[audio[^\]]*\]/gi,
      /\[playlist[^\]]*\]/gi,
      /\[wp_[^\]]*\]/gi,
      /\[vc_[^\]]*\]/gi,
      /\[\/[^\]]*\]/gi,
      /\[[^\]]*id=[^\]]*\]/gi,
      /\[[^\]]*class=[^\]]*\]/gi
    ];

    // CSS and JavaScript patterns
    this.cssJsPatterns = [
      /<style[^>]*>[\s\S]*?<\/style>/gi,
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /\@keyframes[^{]*\{[^}]*\}/gi,
      /\.[a-zA-Z-]+[^{]*\{[^}]*\}/gi,
      /\#[a-zA-Z-]+[^{]*\{[^}]*\}/gi,
      /\s*\{[^}]*\}\s*/g,
      /transition:[^;]*;/gi,
      /opacity:[^;]*;/gi,
      /left:[^;]*;/gi,
      /right:[^;]*;/gi,
      /top:[^;]*;/gi,
      /bottom:[^;]*;/gi
    ];

    // Invalid HTML patterns
    this.invalidHtmlPatterns = [
      /<\/?div[^>]*>/gi,
      /<\/?span[^>]*>/gi,
      /<\/?font[^>]*>/gi,
      /<br\s*\/?>\s*<br\s*\/?>/gi, // Multiple line breaks
      /&nbsp;\s*&nbsp;/gi, // Multiple non-breaking spaces
      /<p>\s*<\/p>/gi, // Empty paragraphs
      /<p>&nbsp;<\/p>/gi, // Paragraphs with only spaces
      /<[^>]*style="[^"]*"[^>]*>/gi, // Inline styles
      /<[^>]*class="[^"]*"[^>]*>/gi // Class attributes
    ];
  }

  // Decode HTML entities
  decodeHtmlEntities(content) {
    if (!content) return '';
    
    try {
      // Use 'he' library for comprehensive decoding
      let decoded = he.decode(content);
      
      // Additional manual decoding for common entities
      decoded = decoded
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#039;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&nbsp;/gi, ' ')
        .replace(/&hellip;/gi, '...')
        .replace(/&mdash;/gi, '—')
        .replace(/&ndash;/gi, '–')
        .replace(/&rsquo;/gi, "'")
        .replace(/&lsquo;/gi, "'")
        .replace(/&rdquo;/gi, '"')
        .replace(/&ldquo;/gi, '"');

      return decoded;
    } catch (error) {
      console.warn('Error decoding HTML entities:', error.message);
      return content;
    }
  }

  // Remove WordPress shortcodes
  removeShortcodes(content) {
    let cleaned = content;
    
    this.shortcodePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Remove remaining square brackets that might be leftover shortcodes
    cleaned = cleaned.replace(/\[[^\]]{1,50}\]/g, '');
    
    return cleaned;
  }

  // Remove CSS and JavaScript
  removeCssJs(content) {
    let cleaned = content;
    
    this.cssJsPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  // Clean and normalize HTML
  cleanHtml(content) {
    let cleaned = content;

    // Remove invalid HTML patterns
    this.invalidHtmlPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Fix common HTML issues
    cleaned = cleaned
      // Remove style and class attributes
      .replace(/\s*style="[^"]*"/gi, '')
      .replace(/\s*class="[^"]*"/gi, '')
      .replace(/\s*id="[^"]*"/gi, '')
      
      // Clean up spacing
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
      
      // Fix paragraph tags
      .replace(/<p>\s*<p>/gi, '<p>')
      .replace(/<\/p>\s*<\/p>/gi, '</p>')
      
      // Clean up line breaks
      .replace(/(<br\s*\/?>){3,}/gi, '<br><br>') // Max 2 line breaks
      .replace(/<br\s*\/?>\s*<\/p>/gi, '</p>') // Remove br before closing p
      .replace(/<p>\s*<br\s*\/?>/gi, '<p>') // Remove br after opening p

    return cleaned;
  }

  // Convert to clean paragraphs
  convertToParagraphs(content) {
    if (!content) return '';

    // Split content into lines
    let lines = content
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Convert lines to paragraphs
    let paragraphs = [];
    let currentParagraph = '';

    lines.forEach(line => {
      // Skip lines that are just HTML tags
      if (line.match(/^<[^>]+>$/)) return;
      
      // If line is short or looks like a heading, treat as separate paragraph
      if (line.length < 50 || line.match(/^[A-Z\u0980-\u09FF][^.!?]*:?\s*$/)) {
        if (currentParagraph) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
        paragraphs.push(line);
      } else {
        // Add to current paragraph
        currentParagraph += (currentParagraph ? ' ' : '') + line;
        
        // If paragraph is getting long, close it
        if (currentParagraph.length > 300 && line.match(/[.!?]$/)) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
      }
    });

    // Add remaining paragraph
    if (currentParagraph) {
      paragraphs.push(currentParagraph.trim());
    }

    // Convert to HTML paragraphs
    return paragraphs
      .filter(p => p.length > 0)
      .map(p => `<p>${p}</p>`)
      .join('\n');
  }

  // Main cleaning function
  cleanContent(content) {
    if (!content || typeof content !== 'string') {
      return '<p>Content not available.</p>';
    }

    console.log('🧹 Cleaning content...');

    try {
      // Step 1: Decode HTML entities
      let cleaned = this.decodeHtmlEntities(content);
      
      // Step 2: Remove WordPress shortcodes
      cleaned = this.removeShortcodes(cleaned);
      
      // Step 3: Remove CSS and JavaScript
      cleaned = this.removeCssJs(cleaned);
      
      // Step 4: Clean HTML tags and attributes
      cleaned = this.cleanHtml(cleaned);
      
      // Step 5: Remove remaining HTML tags for plain text
      cleaned = cleaned.replace(/<[^>]*>/g, ' ');
      
      // Step 6: Final cleanup
      cleaned = cleaned
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines

      // Step 7: Convert to clean paragraphs
      if (cleaned.length > 50) {
        cleaned = this.convertToParagraphs(cleaned);
      } else {
        cleaned = `<p>${cleaned}</p>`;
      }

      return cleaned || '<p>Content not available.</p>';

    } catch (error) {
      console.error('Error cleaning content:', error.message);
      return '<p>Content could not be processed.</p>';
    }
  }

  // Bulk clean function for testing
  cleanMultiple(contents) {
    return contents.map(content => this.cleanContent(content));
  }
}

module.exports = ContentCleaner;
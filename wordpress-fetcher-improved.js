const axios = require('axios');
const fs = require('fs');
const path = require('path');

// WordPress REST API configuration
const WP_BASE_URL = 'https://banglayielts.com/wp-json/wp/v2';
const OUTPUT_DIR = 'wordpress-data';

class WordPressFetcher {
  constructor() {
    this.posts = [];
    this.categories = new Map();
    this.media = new Map();
    this.authors = new Map();
  }

  // Create output directory if it doesn't exist
  ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

  // Clean HTML content for CSV safety
  cleanContentForCSV(htmlContent) {
    if (!htmlContent) return '';
    
    return htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/"/g, '""') // Escape quotes for CSV
      .trim();
  }

  // Safely escape CSV field
  escapeCSVField(value) {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
  }

  // Fetch all categories and store in a Map for quick lookup
  async fetchCategories() {
    console.log('📂 Fetching categories...');
    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${WP_BASE_URL}/categories`, {
          params: {
            per_page: 100,
            page: page
          }
        });

        const categories = response.data;
        
        if (categories.length === 0) {
          hasMore = false;
        } else {
          categories.forEach(category => {
            this.categories.set(category.id, {
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: this.cleanContentForCSV(category.description)
            });
          });
          
          console.log(`   ✓ Fetched ${categories.length} categories from page ${page}`);
          page++;
          
          // Check if there are more pages
          const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
          if (page > totalPages) {
            hasMore = false;
          }
        }
      }

      console.log(`✅ Total categories fetched: ${this.categories.size}`);
    } catch (error) {
      console.error('❌ Error fetching categories:', error.message);
    }
  }

  // Fetch all authors and store in a Map for quick lookup
  async fetchAuthors() {
    console.log('👥 Fetching authors...');
    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${WP_BASE_URL}/users`, {
          params: {
            per_page: 100,
            page: page
          }
        });

        const authors = response.data;
        
        if (authors.length === 0) {
          hasMore = false;
        } else {
          authors.forEach(author => {
            this.authors.set(author.id, {
              id: author.id,
              name: author.name || 'Unknown Author',
              slug: author.slug || '',
              email: author.email || '',
              url: author.url || ''
            });
          });
          
          console.log(`   ✓ Fetched ${authors.length} authors from page ${page}`);
          page++;
          
          // Check if there are more pages
          const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
          if (page > totalPages) {
            hasMore = false;
          }
        }
      }

      console.log(`✅ Total authors fetched: ${this.authors.size}`);
    } catch (error) {
      console.error('❌ Error fetching authors (this is often normal - may require authentication):', error.message);
      // Continue without authors - we'll use 'Unknown Author' as fallback
    }
  }

  // Fetch media items by IDs
  async fetchMediaByIds(mediaIds) {
    if (mediaIds.length === 0) return;

    console.log(`🖼️  Fetching ${mediaIds.length} media items...`);
    
    try {
      // WordPress REST API allows fetching multiple media items by including IDs
      const response = await axios.get(`${WP_BASE_URL}/media`, {
        params: {
          include: mediaIds.join(','),
          per_page: 100
        }
      });

      const mediaItems = response.data;
      
      mediaItems.forEach(media => {
        this.media.set(media.id, {
          id: media.id,
          title: this.cleanContentForCSV(media.title?.rendered || ''),
          url: media.source_url || '',
          alt_text: this.cleanContentForCSV(media.alt_text || ''),
          caption: this.cleanContentForCSV(media.caption?.rendered || ''),
          media_type: media.media_type || '',
          media_details: media.media_details || {}
        });
      });

      console.log(`✅ Fetched ${mediaItems.length} media items`);
    } catch (error) {
      console.error('❌ Error fetching media:', error.message);
    }
  }

  // Fetch all posts with pagination
  async fetchAllPosts() {
    console.log('📝 Fetching posts...');
    
    try {
      let page = 1;
      let hasMore = true;
      let totalPosts = 0;

      while (hasMore) {
        console.log(`   📄 Fetching page ${page}...`);
        
        const response = await axios.get(`${WP_BASE_URL}/posts`, {
          params: {
            per_page: 100,
            page: page,
            status: 'publish' // Only fetch published posts
          }
        });

        const posts = response.data;
        
        if (posts.length === 0) {
          hasMore = false;
        } else {
          this.posts.push(...posts);
          totalPosts += posts.length;
          
          console.log(`   ✓ Fetched ${posts.length} posts from page ${page} (Total: ${totalPosts})`);
          page++;
          
          // Check if there are more pages
          const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
          if (page > totalPages) {
            hasMore = false;
          }
        }
        
        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Total posts fetched: ${this.posts.length}`);
      
      // Extract unique featured media IDs to fetch
      const mediaIds = [...new Set(
        this.posts
          .filter(post => post.featured_media && post.featured_media !== 0)
          .map(post => post.featured_media)
      )];
      
      if (mediaIds.length > 0) {
        await this.fetchMediaByIds(mediaIds);
      }

    } catch (error) {
      console.error('❌ Error fetching posts:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }

  // Process and clean post data
  processPostData() {
    console.log('⚡ Processing post data...');
    
    return this.posts.map(post => {
      // Get category names
      const categoryNames = post.categories
        ? post.categories.map(catId => this.categories.get(catId)?.name || `Unknown (${catId})`).join('; ')
        : '';

      // Get author info
      const author = this.authors.get(post.author) || { name: 'Unknown Author', slug: '', email: '', url: '' };

      // Get featured image info
      const featuredImage = post.featured_media ? this.media.get(post.featured_media) : null;

      // Clean content thoroughly
      const cleanContent = this.cleanContentForCSV(post.content?.rendered || '');
      const cleanExcerpt = this.cleanContentForCSV(post.excerpt?.rendered || '');
      const cleanTitle = this.cleanContentForCSV(post.title?.rendered || '');

      return {
        id: post.id || '',
        title: cleanTitle,
        slug: post.slug || '',
        date: post.date || '',
        date_modified: post.modified || '',
        author_id: post.author || '',
        author_name: author.name,
        author_slug: author.slug,
        status: post.status || '',
        content_clean: cleanContent.substring(0, 32767), // Limit for Excel compatibility
        excerpt_clean: cleanExcerpt,
        categories_ids: post.categories ? post.categories.join('; ') : '',
        categories_names: categoryNames,
        tags_ids: post.tags ? post.tags.join('; ') : '',
        featured_media_id: post.featured_media || '',
        featured_image_url: featuredImage?.url || '',
        featured_image_alt: featuredImage?.alt_text || '',
        featured_image_title: featuredImage?.title || '',
        post_url: post.link || '',
        comment_status: post.comment_status || '',
        ping_status: post.ping_status || '',
        template: post.template || '',
        format: post.format || 'standard',
        word_count: cleanContent.split(' ').length,
        has_featured_image: featuredImage ? 'Yes' : 'No'
      };
    });
  }

  // Convert data to CSV format with proper escaping
  arrayToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.map(header => this.escapeCSVField(header)).join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        return this.escapeCSVField(row[header] || '');
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  // Save data to files
  async saveData(processedData) {
    console.log('💾 Saving data to files...');
    
    try {
      // Save as JSON (complete data)
      const jsonFilePath = path.join(OUTPUT_DIR, 'wordpress-posts-complete.json');
      const jsonData = {
        metadata: {
          total_posts: processedData.length,
          fetched_at: new Date().toISOString(),
          source: WP_BASE_URL,
          categories_count: this.categories.size,
          authors_count: this.authors.size,
          media_count: this.media.size
        },
        posts: processedData,
        categories: Array.from(this.categories.values()),
        authors: Array.from(this.authors.values()),
        media: Array.from(this.media.values())
      };
      
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
      console.log(`✅ Complete JSON saved: ${jsonFilePath}`);

      // Save posts-only JSON (lighter)
      const postsOnlyPath = path.join(OUTPUT_DIR, 'wordpress-posts.json');
      fs.writeFileSync(postsOnlyPath, JSON.stringify({
        metadata: jsonData.metadata,
        posts: processedData
      }, null, 2));
      console.log(`✅ Posts-only JSON saved: ${postsOnlyPath}`);

      // Save as CSV
      const csvFilePath = path.join(OUTPUT_DIR, 'wordpress-posts.csv');
      const csvData = this.arrayToCSV(processedData);
      fs.writeFileSync(csvFilePath, csvData, 'utf8');
      console.log(`✅ CSV saved: ${csvFilePath}`);

      // Save categories separately
      const categoriesPath = path.join(OUTPUT_DIR, 'categories.csv');
      const categoriesData = this.arrayToCSV(Array.from(this.categories.values()));
      fs.writeFileSync(categoriesPath, categoriesData);
      console.log(`✅ Categories CSV saved: ${categoriesPath}`);

      // Create summary file
      const summaryPath = path.join(OUTPUT_DIR, 'SUMMARY.txt');
      const summary = `WordPress Data Export Summary
=====================================
Export Date: ${new Date().toISOString()}
Source: ${WP_BASE_URL}

Statistics:
- Total Posts: ${processedData.length}
- Total Categories: ${this.categories.size}
- Total Authors: ${this.authors.size}
- Total Media Items: ${this.media.size}

Files Generated:
- wordpress-posts.csv (Main CSV file - Excel/Google Sheets compatible)
- wordpress-posts.json (Posts only in JSON format)
- wordpress-posts-complete.json (All data including categories, authors, media)
- categories.csv (All categories in CSV format)

CSV Column Descriptions:
- id: WordPress post ID
- title: Post title (HTML entities removed)
- slug: URL slug
- date: Publication date
- author_name: Author display name
- content_clean: Post content with HTML removed (truncated for Excel)
- excerpt_clean: Post excerpt with HTML removed
- categories_names: Category names (semicolon separated)
- featured_image_url: Featured image URL
- word_count: Approximate word count
- has_featured_image: Yes/No indicator

Notes:
- Content has been cleaned for CSV compatibility
- HTML tags and entities have been removed
- Authors may show as "Unknown Author" if endpoint requires authentication
- Semicolons (;) are used as separators instead of commas to avoid CSV conflicts
- Content is truncated to 32,767 characters for Excel compatibility

Usage Tips:
1. Open wordpress-posts.csv in Excel or Google Sheets
2. Use Text to Columns if needed (comma delimiter)
3. Use wordpress-posts.json for programmatic processing
4. Categories and media are included in the complete JSON file
`;
      
      fs.writeFileSync(summaryPath, summary);
      console.log(`✅ Summary saved: ${summaryPath}`);

    } catch (error) {
      console.error('❌ Error saving files:', error.message);
    }
  }

  // Main execution method
  async run() {
    console.log('🚀 Starting WordPress data extraction...');
    console.log('📡 Source:', WP_BASE_URL);
    console.log('');

    this.ensureOutputDir();

    try {
      // Fetch all required data
      await this.fetchCategories();
      await this.fetchAuthors();
      await this.fetchAllPosts();

      // Process and save data
      const processedData = this.processPostData();
      await this.saveData(processedData);

      console.log('');
      console.log('🎉 WordPress data extraction completed successfully!');
      console.log(`📁 Check the '${OUTPUT_DIR}' folder for all generated files.`);
      console.log('💡 Open wordpress-posts.csv in Excel or Google Sheets');
      console.log('💡 Use wordpress-posts.json for programming/analysis');
      
    } catch (error) {
      console.error('💥 Fatal error during extraction:', error.message);
      process.exit(1);
    }
  }
}

// Run the fetcher if this script is executed directly
if (require.main === module) {
  const fetcher = new WordPressFetcher();
  fetcher.run();
}

module.exports = WordPressFetcher;
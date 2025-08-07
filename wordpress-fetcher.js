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
              description: category.description
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
              name: author.name,
              slug: author.slug,
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
      console.error('❌ Error fetching authors:', error.message);
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
          title: media.title?.rendered || '',
          url: media.source_url || '',
          alt_text: media.alt_text || '',
          caption: media.caption?.rendered || '',
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
        ? post.categories.map(catId => this.categories.get(catId)?.name || `Unknown (${catId})`).join(', ')
        : '';

      // Get author info
      const author = this.authors.get(post.author) || { name: 'Unknown Author' };

      // Get featured image info
      const featuredImage = post.featured_media ? this.media.get(post.featured_media) : null;

      // Clean content (remove HTML tags for CSV, keep for JSON)
      const cleanContent = post.content?.rendered
        ? post.content.rendered.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        : '';

      return {
        id: post.id,
        title: post.title?.rendered || '',
        slug: post.slug || '',
        date: post.date || '',
        date_modified: post.modified || '',
        author_id: post.author || '',
        author_name: author.name || '',
        author_slug: author.slug || '',
        status: post.status || '',
        content_rendered: post.content?.rendered || '',
        content_clean: cleanContent,
        excerpt: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() || '',
        categories_ids: post.categories ? post.categories.join(', ') : '',
        categories_names: categoryNames,
        tags_ids: post.tags ? post.tags.join(', ') : '',
        featured_media_id: post.featured_media || '',
        featured_image_url: featuredImage?.url || '',
        featured_image_alt: featuredImage?.alt_text || '',
        featured_image_title: featuredImage?.title || '',
        post_url: post.link || '',
        comment_count: post.comment_status === 'open' ? 'enabled' : 'disabled',
        ping_status: post.ping_status || '',
        template: post.template || '',
        format: post.format || 'standard',
        meta_description: post.yoast_head_json?.og_description || post.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() || ''
      };
    });
  }

  // Convert data to CSV format
  arrayToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header] || '';
        // Escape double quotes and wrap in quotes if contains comma, newline, or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  // Save data to files
  async saveData(processedData) {
    console.log('💾 Saving data to files...');
    
    try {
      // Save as JSON
      const jsonFilePath = path.join(OUTPUT_DIR, 'wordpress-posts.json');
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
      console.log(`✅ JSON saved: ${jsonFilePath}`);

      // Save as CSV
      const csvFilePath = path.join(OUTPUT_DIR, 'wordpress-posts.csv');
      const csvData = this.arrayToCSV(processedData);
      fs.writeFileSync(csvFilePath, csvData);
      console.log(`✅ CSV saved: ${csvFilePath}`);

      // Save categories separately
      const categoriesPath = path.join(OUTPUT_DIR, 'categories.json');
      fs.writeFileSync(categoriesPath, JSON.stringify(Array.from(this.categories.values()), null, 2));
      console.log(`✅ Categories saved: ${categoriesPath}`);

      // Save authors separately
      const authorsPath = path.join(OUTPUT_DIR, 'authors.json');
      fs.writeFileSync(authorsPath, JSON.stringify(Array.from(this.authors.values()), null, 2));
      console.log(`✅ Authors saved: ${authorsPath}`);

      // Save media separately
      const mediaPath = path.join(OUTPUT_DIR, 'media.json');
      fs.writeFileSync(mediaPath, JSON.stringify(Array.from(this.media.values()), null, 2));
      console.log(`✅ Media saved: ${mediaPath}`);

      // Create summary file
      const summaryPath = path.join(OUTPUT_DIR, 'summary.txt');
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
- wordpress-posts.json (Complete data with metadata)
- wordpress-posts.csv (Simplified tabular format)
- categories.json (All categories)
- authors.json (All authors)
- media.json (All media items)

Notes:
- Only published posts were fetched
- Content is provided in both HTML (content_rendered) and clean text (content_clean) formats
- Featured images are linked where available
- Categories and authors are resolved to their names
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
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

class WordPressMigrator {
  constructor() {
    this.connection = null;
    this.wpData = null;
    this.categoryMapping = new Map();
    this.imageDownloadStats = { total: 0, success: 0, failed: 0 };
  }

  // Connect to MySQL database
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

  // Load WordPress data
  loadWordPressData() {
    try {
      const dataPath = path.join('wordpress-data', 'wordpress-posts-complete.json');
      this.wpData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`✅ Loaded ${this.wpData.posts.length} WordPress posts`);
      console.log(`✅ Found ${this.wpData.categories.length} categories`);
    } catch (error) {
      console.error('❌ Failed to load WordPress data:', error.message);
      throw error;
    }
  }

  // Create IELTS-specific categories
  async setupCategories() {
    console.log('📂 Setting up IELTS categories...');
    
    const ieltsCategoriesMap = {
      'Ielts': 'IELTS General',
      'Reading': 'IELTS Reading',
      'Writing': 'IELTS Writing', 
      'Listening': 'IELTS Listening',
      'Speaking': 'IELTS Speaking',
      'Official News': 'IELTS Official News',
      'PTE': 'PTE Preparation',
      'Higher Study': 'Higher Study Guide',
      'Uncategorized': 'General Tips',
      'Offical': 'IELTS Official' // Note: WordPress has a typo
    };

    try {
      // First, clear existing sample categories and insert IELTS categories
      await this.connection.execute('DELETE FROM categories WHERE name IN ("Technology", "Programming", "Web Development", "Mobile Development", "Data Science", "Artificial Intelligence", "Cybersecurity", "Cloud Computing", "DevOps", "Tutorials")');
      
      // Insert IELTS categories
      for (const [wpCategoryName, localCategoryName] of Object.entries(ieltsCategoriesMap)) {
        const [result] = await this.connection.execute(
          'INSERT IGNORE INTO categories (name) VALUES (?)',
          [localCategoryName]
        );
        
        if (result.insertId) {
          console.log(`   ✓ Created category: ${localCategoryName}`);
        }
        
        // Get the category ID for mapping
        const [rows] = await this.connection.execute(
          'SELECT id FROM categories WHERE name = ?',
          [localCategoryName]
        );
        
        if (rows.length > 0) {
          this.categoryMapping.set(wpCategoryName, rows[0].id);
        }
      }

      console.log(`✅ Set up ${this.categoryMapping.size} category mappings`);
    } catch (error) {
      console.error('❌ Error setting up categories:', error.message);
      throw error;
    }
  }

  // Create images directory
  ensureImagesDirectory() {
    const imageDir = path.join('backend', 'uploads', 'images');
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
      console.log('✅ Created images directory');
    }
  }

  // Download and save image
  async downloadImage(imageUrl, fileName) {
    try {
      if (!imageUrl) return null;
      
      const response = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 10000
      });
      
      const imagePath = path.join('backend', 'uploads', 'images', fileName);
      const writer = fs.createWriteStream(imagePath);
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.imageDownloadStats.success++;
          resolve(`uploads/images/${fileName}`);
        });
        writer.on('error', reject);
      });
      
    } catch (error) {
      this.imageDownloadStats.failed++;
      console.log(`   ⚠️ Failed to download image: ${imageUrl.substring(0, 50)}...`);
      return null;
    }
  }

  // Generate SEO-friendly slug
  generateSlug(title, id) {
    if (!title) return `post-${id}`;
    
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 100) + (id ? `-${id}` : ''); // Add ID to ensure uniqueness
  }

  // Extract meta description from content
  extractMetaDescription(content, excerpt) {
    let description = excerpt || content || '';
    
    // Clean and truncate for meta description
    description = description
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 155); // SEO optimal length
    
    return description || 'IELTS preparation tips and strategies from Banglay IELTS.';
  }

  // Extract keywords from title and categories
  extractKeywords(title, categories) {
    const keywords = ['IELTS', 'Banglay IELTS'];
    
    if (title) {
      // Extract meaningful words from title
      const titleWords = title
        .toLowerCase()
        .match(/\b\w{3,}\b/g) || [];
      keywords.push(...titleWords.slice(0, 5));
    }
    
    if (categories) {
      keywords.push(...categories.split(';').map(cat => cat.trim()));
    }
    
    return [...new Set(keywords)].join(', ');
  }

  // Migrate posts to database
  async migratePosts() {
    console.log('📝 Starting post migration...');
    
    // Clear existing sample blog posts
    await this.connection.execute('DELETE FROM blogs WHERE author IN ("রহিম আহমেদ", "ফাতিমা খান", "করিম উদ্দিন")');
    console.log('✅ Cleared sample blog posts');
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const post of this.wpData.posts) {
      try {
        // Determine category ID
        const wpCategories = post.categories_names ? post.categories_names.split(';') : [];
        let categoryId = null;
        
        // Find first matching category
        for (const wpCategory of wpCategories) {
          const trimmedCategory = wpCategory.trim();
          if (this.categoryMapping.has(trimmedCategory)) {
            categoryId = this.categoryMapping.get(trimmedCategory);
            break;
          }
        }
        
        // Default to "IELTS General" if no category found
        if (!categoryId) {
          categoryId = this.categoryMapping.get('Ielts') || 1;
        }

        // Download featured image if available
        let imagePath = null;
        if (post.featured_image_url) {
          this.imageDownloadStats.total++;
          const imageExtension = path.extname(new URL(post.featured_image_url).pathname) || '.jpg';
          const imageName = `wp-${post.id}${imageExtension}`;
          imagePath = await this.downloadImage(post.featured_image_url, imageName);
        }

        // Generate unique slug
        const slug = this.generateSlug(post.title, post.id);
        
        // Prepare meta data
        const metaDescription = this.extractMetaDescription(post.content_clean, post.excerpt_clean);
        const metaKeywords = this.extractKeywords(post.title, post.categories_names);
        
        // Clean and prepare content
        let content = post.content_clean || post.excerpt_clean || 'Content migrated from WordPress.';
        if (content.length > 65535) { // TEXT column limit
          content = content.substring(0, 65535) + '...';
        }

        // Insert post into database
        const [result] = await this.connection.execute(
          `INSERT INTO blogs 
           (title, content, slug, author, category_id, image, meta_keywords, meta_description, views, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            post.title || `Post ${post.id}`,
            content,
            slug,
            post.author_name || 'Banglay IELTS Team',
            categoryId,
            imagePath,
            metaKeywords.substring(0, 500), // Respect column limit
            metaDescription,
            Math.floor(Math.random() * 100) + 10, // Random view count between 10-110
            post.date || new Date().toISOString(),
            post.date_modified || post.date || new Date().toISOString()
          ]
        );

        if (result.insertId) {
          migratedCount++;
          if (migratedCount % 10 === 0) {
            console.log(`   ✓ Migrated ${migratedCount} posts...`);
          }
        }

      } catch (error) {
        skippedCount++;
        console.log(`   ⚠️ Skipped post ${post.id}: ${error.message}`);
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`   📝 Posts migrated: ${migratedCount}`);
    console.log(`   ⚠️ Posts skipped: ${skippedCount}`);
    console.log(`   🖼️ Images downloaded: ${this.imageDownloadStats.success}/${this.imageDownloadStats.total}`);
    console.log(`   ❌ Image failures: ${this.imageDownloadStats.failed}`);
  }

  // Update existing frontend if needed
  async updateBlogStats() {
    try {
      const [posts] = await this.connection.execute('SELECT COUNT(*) as total FROM blogs');
      const [categories] = await this.connection.execute('SELECT COUNT(*) as total FROM categories');
      
      console.log(`\n📊 Current Blog Statistics:`);
      console.log(`   📝 Total Posts: ${posts[0].total}`);
      console.log(`   📂 Total Categories: ${categories[0].total}`);
      
      // Show category breakdown
      const [categoryStats] = await this.connection.execute(`
        SELECT c.name, COUNT(b.id) as post_count 
        FROM categories c 
        LEFT JOIN blogs b ON c.id = b.category_id 
        GROUP BY c.id, c.name 
        ORDER BY post_count DESC
      `);
      
      console.log(`\n📊 Posts by Category:`);
      categoryStats.forEach(stat => {
        console.log(`   📂 ${stat.name}: ${stat.post_count} posts`);
      });
      
    } catch (error) {
      console.error('❌ Error fetching blog stats:', error.message);
    }
  }

  // Main migration process
  async migrate() {
    console.log('🚀 Starting WordPress to Blog Migration');
    console.log('=====================================\n');

    try {
      // Load data and connect
      this.loadWordPressData();
      await this.connectDatabase();
      
      // Set up categories
      await this.setupCategories();
      
      // Ensure images directory exists
      this.ensureImagesDirectory();
      
      // Migrate posts
      await this.migratePosts();
      
      // Show final stats
      await this.updateBlogStats();
      
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 Your WordPress posts are now available in your blog website');
      console.log('🌐 Start your servers to see the migrated content:');
      console.log('   Backend: cd backend && npm start');
      console.log('   Frontend: cd frontend && npm start');
      
    } catch (error) {
      console.error('\n💥 Migration failed:', error.message);
      process.exit(1);
    } finally {
      if (this.connection) {
        await this.connection.end();
        console.log('✅ Database connection closed');
      }
    }
  }
}

// Add to package.json scripts
function updatePackageScripts() {
  const packagePath = path.join('backend', 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      packageData.scripts = packageData.scripts || {};
      packageData.scripts['migrate:wordpress'] = 'node ../migrate-wordpress-data.js';
      
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      console.log('✅ Updated backend package.json with migration script');
    } catch (error) {
      console.log('⚠️ Could not update backend package.json:', error.message);
    }
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  updatePackageScripts();
  const migrator = new WordPressMigrator();
  migrator.migrate();
}

module.exports = WordPressMigrator;
# WordPress Data Fetcher for Banglay IELTS

This tool extracts all published blog posts, categories, authors, and media from the Banglay IELTS WordPress site using the WordPress REST API.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Fetcher
```bash
npm run fetch
```

Or directly:
```bash
node wordpress-fetcher.js
```

## 📊 What It Fetches

### Posts Data
- **Basic Info**: ID, title, slug, publication date, modification date
- **Content**: Full HTML content + clean text version
- **Author**: Author ID, name, and slug
- **Categories**: Category IDs and resolved category names
- **Media**: Featured image URL, alt text, and title
- **SEO**: Meta description, excerpt
- **Technical**: Post status, format, comment settings

### Related Data
- **Categories**: All categories with names, slugs, descriptions
- **Authors**: All authors with names, slugs, email, URLs
- **Media**: Featured images with URLs, alt text, captions

## 📁 Output Files

The script creates a `wordpress-data/` folder with:

### Main Data Files
- `wordpress-posts.json` - Complete data in JSON format with metadata
- `wordpress-posts.csv` - Simplified tabular format for Excel/spreadsheets

### Supporting Data Files
- `categories.json` - All categories data
- `authors.json` - All authors data  
- `media.json` - All media/images data
- `summary.txt` - Export summary and statistics

## 📋 CSV Columns

The CSV file includes these columns:
- `id` - WordPress post ID
- `title` - Post title
- `slug` - URL slug
- `date` - Publication date
- `date_modified` - Last modification date
- `author_id` - Author ID
- `author_name` - Author display name
- `author_slug` - Author slug
- `status` - Post status (publish, draft, etc.)
- `content_rendered` - Full HTML content
- `content_clean` - Clean text content (no HTML)
- `excerpt` - Post excerpt
- `categories_ids` - Category IDs (comma-separated)
- `categories_names` - Category names (comma-separated)
- `tags_ids` - Tag IDs (comma-separated)
- `featured_media_id` - Featured image ID
- `featured_image_url` - Featured image URL
- `featured_image_alt` - Featured image alt text
- `featured_image_title` - Featured image title
- `post_url` - Full post URL
- `comment_count` - Comment status
- `template` - Post template
- `format` - Post format
- `meta_description` - SEO meta description

## 🔧 How It Works

### 1. **Pagination Handling**
The script automatically handles WordPress REST API pagination:
- Fetches 100 items per request (maximum allowed)
- Continues until all pages are retrieved
- Respects API rate limits with small delays

### 2. **Data Resolution**
- Fetches categories first, then resolves category IDs to names in posts
- Fetches authors first, then resolves author IDs to names in posts
- Fetches featured media for all posts that have featured images

### 3. **Error Handling**
- Graceful handling of API errors
- Continues processing if individual requests fail
- Detailed error logging

## 📊 API Endpoints Used

```javascript
// Main data endpoints
GET /wp-json/wp/v2/posts?per_page=100&page=1&status=publish
GET /wp-json/wp/v2/categories?per_page=100&page=1
GET /wp-json/wp/v2/users?per_page=100&page=1
GET /wp-json/wp/v2/media?include=1,2,3...&per_page=100

// Example full URLs:
// https://banglayielts.com/wp-json/wp/v2/posts?per_page=100&status=publish
// https://banglayielts.com/wp-json/wp/v2/categories?per_page=100
```

## 🛠️ Customization

### Change Output Directory
```javascript
const OUTPUT_DIR = 'your-custom-folder';
```

### Modify WordPress URL
```javascript
const WP_BASE_URL = 'https://your-wordpress-site.com/wp-json/wp/v2';
```

### Add Custom Fields
Extend the `processPostData()` method to include additional fields available in the WordPress API response.

### Filter Posts
Modify the posts API call to add filters:
```javascript
// Only posts from specific category
params: {
  per_page: 100,
  page: page,
  status: 'publish',
  categories: '5,10,15' // Category IDs
}

// Posts from specific date range
params: {
  per_page: 100,
  page: page,
  status: 'publish',
  after: '2023-01-01T00:00:00',
  before: '2023-12-31T23:59:59'
}
```

## 📈 Performance Notes

- **Speed**: Fetches ~100 posts per second (depending on server response time)
- **Memory**: Keeps all data in memory during processing
- **Network**: Makes multiple API calls (posts + categories + authors + media)
- **Rate Limiting**: Includes 100ms delays between requests to be server-friendly

## 🔍 Troubleshooting

### Common Issues

1. **Network Errors**: Check if the WordPress site is accessible
2. **Empty Results**: Verify the site has published posts
3. **Permission Errors**: Some fields may require authentication
4. **Memory Issues**: For very large sites (10,000+ posts), consider processing in batches

### Debug Mode
Add console.log statements in the script to see detailed API responses:
```javascript
console.log('API Response:', response.data);
```

## 📄 Example Usage

### Basic Usage
```bash
# Fetch all data
npm run fetch

# Check the results
ls wordpress-data/
cat wordpress-data/summary.txt
```

### Programmatic Usage
```javascript
const WordPressFetcher = require('./wordpress-fetcher');

const fetcher = new WordPressFetcher();
fetcher.run().then(() => {
  console.log('Data extraction completed!');
});
```

## 📞 Support

For issues specific to the Banglay IELTS WordPress API:
- Check the WordPress REST API documentation
- Verify API endpoint accessibility
- Contact the site administrator if endpoints are restricted

---

**Note**: This tool respects the WordPress REST API rate limits and only fetches publicly available data. No authentication is required for published posts, categories, and public author information.
const fs = require('fs');
const path = require('path');

// Function to display CSV preview
function previewCSV() {
  const csvPath = path.join('wordpress-data', 'wordpress-posts.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('❌ CSV file not found. Run the fetcher first: npm run fetch');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  
  console.log('📊 WordPress Posts CSV Preview');
  console.log('=' * 50);
  console.log(`Total rows: ${lines.length - 1} (excluding header)`);
  console.log('');
  
  // Show header
  console.log('📋 Column Headers:');
  const headers = lines[0].split(',');
  headers.forEach((header, index) => {
    console.log(`   ${index + 1}. ${header}`);
  });
  
  console.log('');
  console.log('📄 Sample Data (First 3 Posts):');
  console.log('=' * 50);
  
  // Show first 3 data rows
  for (let i = 1; i <= Math.min(4, lines.length - 1); i++) {
    const row = lines[i].split(',');
    console.log(`\n🔸 Post ${i}:`);
    console.log(`   ID: ${row[0]}`);
    console.log(`   Title: ${row[1]?.replace(/"/g, '')}`);
    console.log(`   Slug: ${row[2]}`);
    console.log(`   Date: ${row[3]}`);
    console.log(`   Author: ${row[6]?.replace(/"/g, '')}`);
    console.log(`   Categories: ${row[11]?.replace(/"/g, '')}`);
    console.log(`   Featured Image: ${row[15] ? 'Yes' : 'No'}`);
  }
}

// Function to display JSON summary
function previewJSON() {
  const jsonPath = path.join('wordpress-data', 'wordpress-posts.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ JSON file not found. Run the fetcher first: npm run fetch');
    return;
  }

  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  console.log('\n\n🗂️  JSON Data Summary');
  console.log('=' * 50);
  console.log('📊 Metadata:');
  console.log(`   Total Posts: ${jsonContent.metadata.total_posts}`);
  console.log(`   Fetched At: ${jsonContent.metadata.fetched_at}`);
  console.log(`   Categories: ${jsonContent.metadata.categories_count}`);
  console.log(`   Authors: ${jsonContent.metadata.authors_count}`);
  console.log(`   Media Items: ${jsonContent.metadata.media_count}`);
  
  console.log('\n📂 Categories:');
  jsonContent.categories.forEach(cat => {
    console.log(`   • ${cat.name} (${cat.slug})`);
  });
  
  console.log('\n📄 Sample Post Structure:');
  if (jsonContent.posts.length > 0) {
    const samplePost = jsonContent.posts[0];
    console.log('   Keys available for each post:');
    Object.keys(samplePost).forEach(key => {
      console.log(`   • ${key}`);
    });
  }
}

// Function to show file sizes
function showFileSizes() {
  const dataDir = 'wordpress-data';
  console.log('\n\n📁 Generated Files:');
  console.log('=' * 50);
  
  const files = [
    'wordpress-posts.json',
    'wordpress-posts.csv', 
    'categories.json',
    'authors.json',
    'media.json',
    'summary.txt'
  ];
  
  files.forEach(filename => {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   📄 ${filename}`);
      console.log(`      Size: ${sizeKB} KB (${sizeMB} MB)`);
      console.log(`      Path: ${filePath}`);
      console.log('');
    }
  });
}

// Run all preview functions
console.log('🔍 WordPress Data Preview Tool');
console.log('================================\n');

previewCSV();
previewJSON();
showFileSizes();

console.log('\n✅ Preview completed!');
console.log('💡 Open the CSV file in Excel or Google Sheets for easier viewing.');
console.log('💡 Use the JSON file for programmatic data processing.');
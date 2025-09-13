// Test script for link-preview API endpoint
const axios = require('axios');

// List of URLs to test
const testUrls = [
  'https://www.youtube.com/watch?v=aNwW04b5ciM', // YouTube URL that was failing
  'https://www.youtube.com/watch?v=rIYnMvWnCqw', // Another YouTube URL that's failing
  'https://github.com/vercel/next.js',           // GitHub URL
  'https://www.bbc.com/news',                    // News site
  'https://invalid-url-that-doesnt-exist.xyz',   // Invalid URL
  'not-a-url'                                    // Not a URL format
];

async function testLinkPreview() {
  console.log('Testing link-preview API with various URLs...');
  console.log('----------------------------------------');
  
  for (const url of testUrls) {
    console.log(`Testing URL: ${url}`);
    try {
      const response = await axios.get(`http://localhost:3000/api/link-preview?url=${encodeURIComponent(url)}`);
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('----------------------------------------');
  }
}

testLinkPreview();
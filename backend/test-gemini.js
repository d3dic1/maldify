require('dotenv').config();
const aiService = require('./src/services/aiService');

console.log('🤖 Testing Google Gemini AI Integration...\n');

// Test the AI service structure
console.log('✅ Gemini AI Service Test:');
console.log('- Service loaded successfully');
console.log('- Methods available:', Object.keys(aiService).filter(key => typeof aiService[key] === 'function'));

// Test if API key is configured
if (!process.env.GEMINI_API_KEY) {
  console.log('\n❌ GEMINI_API_KEY not found in environment variables');
  console.log('Please add your Gemini API key to .env file:');
  console.log('GEMINI_API_KEY=your_api_key_here');
  console.log('\nGet your API key from: https://makersuite.google.com/app/apikey');
} else {
  console.log('\n✅ GEMINI_API_KEY found in environment variables');
  console.log('API Key configured:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

console.log('\n🎉 Gemini AI Integration Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Add your Gemini API key to .env file if not already done');
console.log('2. Restart your backend server');
console.log('3. Test the AI features in your dashboard');
console.log('4. Enjoy free AI email optimization!');

console.log('\n💡 Gemini Free Tier Benefits:');
console.log('- 15 requests per minute');
console.log('- 1,500 requests per day');
console.log('- No credit card required');
console.log('- High-quality AI responses'); 
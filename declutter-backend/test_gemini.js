require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Fetching models with key length:', apiKey.length);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log('Available models:', data.models.map(m => m.name));
    } else {
      console.log('Error/Response:', data);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testGemini();

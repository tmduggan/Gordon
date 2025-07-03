// Groq API Configuration
// Add your Groq API key to your environment variables or Firebase Functions config

const GROQ_CONFIG = {
  // API Base URL
  BASE_URL: 'https://api.groq.com/openai/v1',
  
  // Model to use (Llama-3.1-8B-Instruct is most cost-effective)
  MODEL: 'llama3-8b-8192',
  
  // Alternative models you can use:
  // 'llama3-70b-8192' - More powerful but more expensive
  // 'mixtral-8x7b-32768' - Good balance of power and cost
  
  // Rate limiting settings
  RATE_LIMITS: {
    basic: { daily: 0, weekly: 0, monthly: 0 },
    premium: { daily: 0, weekly: 0, monthly: 0 },
    admin: { daily: 50, weekly: 250, monthly: 1000 }
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 30000,
  
  // Maximum tokens for responses
  MAX_TOKENS: 2000
};

export default GROQ_CONFIG; 
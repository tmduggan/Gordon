const axios = require('axios');
const fs = require('fs');

// This would be a private GitHub gist ID
const GIST_ID = 'your-private-gist-id';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Personal access token

async function fetchSecretsFromGist() {
  try {
    const response = await axios.get(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const secrets = JSON.parse(response.data.files['secrets.json'].content);
    
    // Create .env file
    const envContent = `NUTRITIONIX_APP_ID=${secrets.nutritionix.appId}
NUTRITIONIX_APP_KEY=${secrets.nutritionix.appKey}`;
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ Secrets fetched from GitHub Gist and .env created');
    
    return secrets;
  } catch (error) {
    console.error('❌ Error fetching secrets:', error.message);
  }
}

fetchSecretsFromGist(); 
const fs = require('fs');
const crypto = require('crypto');

// This would be stored in Cursor's settings sync
const ENCRYPTED_SECRETS = {
  // These would be encrypted and synced via Cursor
  nutritionix: {
    appId: 'encrypted_app_id_here',
    appKey: 'encrypted_app_key_here'
  }
};

// Simple encryption key (in practice, use a more secure method)
const ENCRYPTION_KEY = process.env.CURSOR_SECRET_KEY || 'your-secret-key';

function decrypt(text, key) {
  // Simple decryption - in production use proper encryption
  return text; // Placeholder
}

function getSecrets() {
  return {
    NUTRITIONIX_APP_ID: decrypt(ENCRYPTED_SECRETS.nutritionix.appId, ENCRYPTION_KEY),
    NUTRITIONIX_APP_KEY: decrypt(ENCRYPTED_SECRETS.nutritionix.appKey, ENCRYPTION_KEY)
  };
}

// Create .env file with decrypted secrets
function createEnvFile() {
  const secrets = getSecrets();
  const envContent = `NUTRITIONIX_APP_ID=${secrets.NUTRITIONIX_APP_ID}
NUTRITIONIX_APP_KEY=${secrets.NUTRITIONIX_APP_KEY}`;
  
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created with secrets');
}

createEnvFile(); 
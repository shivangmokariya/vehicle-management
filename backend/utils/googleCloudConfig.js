const { Storage } = require('@google-cloud/storage');

// Function to create Google Cloud credentials from environment variables
function getGoogleCloudCredentials() {
  // Check if environment variables are available
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error('Google Cloud credentials not found in environment variables. Please set up your .env file.');
  }

  return {
    type: 'service_account',
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
    token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN
  };
}

// Function to initialize Google Cloud Storage with environment variables
function initializeGoogleCloudStorage() {
  try {
    const credentials = getGoogleCloudCredentials();
    const storage = new Storage({
      projectId: credentials.project_id,
      credentials: credentials
    });
    return storage;
  } catch (error) {
    console.error('Error initializing Google Cloud Storage:', error.message);
    throw error;
  }
}

// Function to get storage bucket
function getStorageBucket(bucketName) {
  const storage = initializeGoogleCloudStorage();
  return storage.bucket(bucketName);
}

module.exports = {
  getGoogleCloudCredentials,
  initializeGoogleCloudStorage,
  getStorageBucket
}; 
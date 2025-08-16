// Environment configuration
export const config = {
  API_BASE_URL: 'https://vehicle-management-z4pv.onrender.com',
  // Upload configuration
  UPLOAD_CHUNK_SIZE: 100, // Number of vehicles per chunk
  UPLOAD_DELAY_MS: 100,   // Delay between chunks in milliseconds
}

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('Environment config loaded:', config)
  console.log('API_BASE_URL:', config.API_BASE_URL)
}

export default config

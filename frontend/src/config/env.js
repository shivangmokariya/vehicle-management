// Environment configuration
const getApiBaseUrl = () => {
  // Always use the Render backend for now to ensure consistency
  return 'https://vehicle-management-z4pv.onrender.com'
}

export const config = {
  API_BASE_URL: getApiBaseUrl(),
}

// Debug logging
console.log('Environment config loaded:', config)
console.log('API_BASE_URL:', config.API_BASE_URL)
console.log('import.meta.env:', import.meta.env)

export default config

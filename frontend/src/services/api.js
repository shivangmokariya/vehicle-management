import axios from 'axios'
import { config } from '../config/env'

// Create axios instance
const api = axios.create({
  baseURL: config.API_BASE_URL + '/api',
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
}

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  uploadProfileImage: (id, formData) => api.post(`/users/${id}/profile-image`, formData),
  deleteProfileImage: (id) => api.delete(`/users/${id}/profile-image`),
}

// Vehicles API
export const vehiclesAPI = {
  getVehicles: (params) => api.get('/vehicles', { params }),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  updateVehicle: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
  uploadExcel: (formData) => api.post('/vehicles/upload', formData),
  uploadVehicleData: (data) => api.post('/vehicles/upload-data', data),
  getStats: () => api.get('/vehicles/stats/summary'),
  getGroups: () => api.get('/vehicles/groups'),
  getBatches: () => api.get('/vehicles/batches'),
  getBatchVehicles: (batchId, params) => api.get(`/vehicles/batches/${batchId}/vehicles`, { params }),
  renameBatch: (batchId, fileName) => api.put(`/vehicles/batches/${batchId}/rename`, { fileName }),
  updateBatchCompany: (batchId, companyName) => api.put(`/vehicles/batches/${batchId}/company`, { companyName }),
  getVehicleTypes: () => api.get('/vehicles/vehicle-types'),
  deleteBatch: (batchId) => api.delete(`/vehicles/batches/${batchId}`),
}

export const dashboardAPI = {
  getSummary: () => api.get('/users/dashboard/summary'),
}

export default api 
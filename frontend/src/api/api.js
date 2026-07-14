import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (data) => api.post('/auth/login', data)
export const registerUser = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')

export const createQuote = (data) => api.post('/quote', data)
export const getQuotes = () => api.get('/quote')
export const deleteQuote = (id) => api.delete(`/quote/${id}`)

export const createCustomer = (data) => api.post('/crm', data)
export const getCustomers = () => api.get('/crm')
export const searchCustomers = (q) => api.get(`/crm/search?q=${encodeURIComponent(q)}`)
export const updateCustomer = (id, data) => api.put(`/crm/${id}`, data)

// Catalog (Products)
export const getCatalogProducts = () => api.get('/catalog')
export const searchCatalog = (q) => api.get(`/catalog/search?q=${encodeURIComponent(q)}`)
export const createCatalogProduct = (data) => api.post('/catalog', data)
export const updateCatalogProduct = (id, data) => api.put(`/catalog/${id}`, data)
export const deleteCatalogProduct = (id) => api.delete(`/catalog/${id}`)

export const updateProfile = (data) => api.put('/auth/me', data)

// Admin routes
export const getUsers = () => api.get('/admin/users')
export const updateUserStatus = (id, status) => api.put(`/admin/users/${id}/status`, { status })
export const updateUserByAdmin = (id, data) => api.put(`/admin/users/${id}`, data)
export const getUserCustomers = (id) => api.get(`/admin/users/${id}/customers`)
export const getUserQuotes = (id) => api.get(`/admin/users/${id}/quotes`)

// Team Management
export const getTeam = () => api.get('/auth/team')
export const linkAlmacenador = (linkCode) => api.post('/auth/team/link', { linkCode })
export const unlinkAlmacenador = (id) => api.delete(`/auth/team/unlink/${id}`)

// Inventory
export const getInventory = () => api.get('/inventory')
export const createInventory = (data) => api.post('/inventory', data)
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data)

export default api

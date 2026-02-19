import axios from 'axios'

// Next.js rewrites proxy /api/* → localhost:8000/api/* (no CORS needed)
const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

// Products
export const productsApi = {
  getAll: (params?: any) => api.get('/products/', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products/', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/products/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' },
    })
  },
  sell: (id: number, salePrice: number) =>
    api.post(`/products/${id}/sell`, { sale_price: salePrice }),
}

// Categories
export const categoriesApi = {
  getAll: (includeInactive?: boolean) => 
    api.get('/categories/', { params: { include_inactive: includeInactive } }),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories/', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

// Inventory
export const inventoryApi = {
  getSummary: () => api.get('/inventory/summary'),
  getByCategory: () => api.get('/inventory/by-category'),
  getByMaterial: () => api.get('/inventory/by-material'),
  getByStockStatus: () => api.get('/inventory/by-stock-status'),
  getMissing: () => api.get('/inventory/missing'),
  getNeeded: () => api.get('/inventory/needed'),
  getEmptyCategories: () => api.get('/inventory/empty-categories'),
  getDailyLog: (days?: number) => api.get('/inventory/daily-log', { params: { days } }),
  getSoldProducts: (params?: any) => api.get('/inventory/sold-products', { params }),
}

// Finance
export const financeApi = {
  getTransactions: (params?: any) => api.get('/finance/transactions', { params }),
  createTransaction: (data: any) => api.post('/finance/transactions', data),
  deleteTransaction: (id: number) => api.delete(`/finance/transactions/${id}`),
  getExpenses: (params?: any) => api.get('/finance/expenses', { params }),
  createExpense: (data: any) => api.post('/finance/expenses', data),
  deleteExpense: (id: number) => api.delete(`/finance/expenses/${id}`),
  getSummary: (params?: any) => api.get('/finance/summary', { params }),
}

// Calendar
export const calendarApi = {
  getDaily: (date: string) => api.get(`/calendar/daily/${date}`),
  getMonthly: (year: number, month: number) => 
    api.get(`/calendar/monthly/${year}/${month}`),
  getUpcomingNotes: () => api.get('/calendar/upcoming-notes'),
}

// Notes & Reminders
export const notesApi = {
  getReminders: (params?: any) => api.get('/notes/reminders', { params }),
  createReminder: (data: any) => api.post('/notes/reminders', data),
  updateReminder: (id: number, data: any) => api.put(`/notes/reminders/${id}`, data),
  deleteReminder: (id: number) => api.delete(`/notes/reminders/${id}`),
  getNotes: (params?: any) => api.get('/notes/notes', { params }),
  createNote: (data: any) => api.post('/notes/notes', data),
  updateNote: (id: number, data: any) => api.put(`/notes/notes/${id}`, data),
  deleteNote: (id: number) => api.delete(`/notes/notes/${id}`),
}

// Price Ranges
export const priceRangesApi = {
  getAll: (params?: any) => api.get('/price-ranges/', { params }),
  getById: (id: number) => api.get(`/price-ranges/${id}`),
  create: (data: any) => api.post('/price-ranges/', data),
  update: (id: number, data: any) => api.put(`/price-ranges/${id}`, data),
  delete: (id: number) => api.delete(`/price-ranges/${id}`),
}

// Suppliers
export const suppliersApi = {
  getAll: (includeInactive?: boolean) => 
    api.get('/suppliers/', { params: { include_inactive: includeInactive } }),
  getById: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers/', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
}

// AI Agent
export const aiApi = {
  status: () => api.get('/ai/status'),
  transcribe: (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    return api.post('/ai/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' },
      timeout: 30000,
    })
  },
  analyze: (images: File[], description: string) => {
    const formData = new FormData()
    images.forEach((img) => formData.append('images', img))
    formData.append('description', description)
    return api.post('/ai/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' },
      timeout: 180000,
    })
  },
  analyzeAndSave: (images: File[], description: string, autoSave: boolean = false) => {
    const formData = new FormData()
    images.forEach((img) => formData.append('images', img))
    formData.append('description', description)
    formData.append('auto_save', String(autoSave))
    return api.post('/ai/analyze-and-save', formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' },
      timeout: 180000,
    })
  },
}

export default api


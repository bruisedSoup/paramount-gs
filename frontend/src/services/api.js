import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
    // Use includes() instead of startsWith() — Axios prepends a leading slash
    // so 'auth/login/' never matches, causing stale tokens to be sent on login
    const isAuthEndpoint = config.url && (
        config.url.includes('auth/login/') ||
        config.url.includes('auth/register/')
    )
    if (!isAuthEndpoint) {
        const token = localStorage.getItem('access_token')
        if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            try {
                const refresh = localStorage.getItem('refresh_token')
                const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh })
                localStorage.setItem('access_token', data.access)
                original.headers.Authorization = `Bearer ${data.access}`
                return api(original)
            } catch {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('user')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// Auth
export const register = (data) => api.post('/auth/register/', data)
export const login = (data) => api.post('/auth/login/', data)
export const logout = (refresh) => api.post('/auth/logout/', { refresh })
export const getProfile = () => api.get('/auth/profile/')

// Products
export const getProducts = (params) => api.get('/products/', { params })
export const getProduct = (id) => api.get(`/products/${id}/`)
export const createProduct = (data) => api.post('/products/', data)
export const updateProduct = (id, data) => api.patch(`/products/${id}/`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}/`)

// Orders
export const getOrders = () => api.get('/orders/')
export const createOrder = (data) => api.post('/orders/', data)
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/`, { status })
export const confirmReceived = (id) => api.patch(`/orders/${id}/`, { action: 'confirm_received' })

// Reviews
export const getProductReviews = (productId) => api.get(`/products/${productId}/reviews/`)
export const createReview = (productId, data) => api.post(`/products/${productId}/reviews/`, data)
export const getMyReviews = () => api.get('/reviews/mine/')
export const editReview = (reviewId, data) => api.patch(`/reviews/${reviewId}/`, data)
export const replyToReview = (reviewId, body) => api.post(`/reviews/${reviewId}/reply/`, { body })

// Product Updates
export const getProductUpdates = (productId) => api.get(`/products/${productId}/updates/`)
export const createProductUpdate = (productId, data) => api.post(`/products/${productId}/updates/`, data)
export const commentOnUpdate = (updateId, body) => api.post(`/product-updates/${updateId}/comments/`, { body })

// Admin
export const getDashboard = () => api.get('/admin/dashboard/')

export default api
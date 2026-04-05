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

const fmtMoney = (value) => Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const csvCell = (value) => {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const downloadBlob = (blob, filename) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
}

const escapePdfText = (text) => String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const makeSimplePdfBlob = (lines) => {
    const pageHeight = 792
    const top = 760
    const left = 40
    const lineHeight = 14
    const linesPerPage = 48
    const pages = []

    for (let i = 0; i < lines.length; i += linesPerPage) {
        const chunk = lines.slice(i, i + linesPerPage)
        let stream = 'BT\n/F1 10 Tf\n'
        chunk.forEach((line, index) => {
            const y = top - (index * lineHeight)
            stream += `1 0 0 1 ${left} ${y} Tm (${escapePdfText(line)}) Tj\n`
        })
        stream += 'ET'
        pages.push(stream)
    }

    const objects = []
    objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
    const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')
    objects.push(`2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pages.length} >> endobj`)

    pages.forEach((stream, i) => {
        const pageObjNum = 3 + i * 2
        const contentObjNum = pageObjNum + 1
        objects.push(`${pageObjNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjNum} 0 R >> endobj`)
        objects.push(`${contentObjNum} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`)
    })

    const fontObjNum = 3 + pages.length * 2
    objects.push(`${fontObjNum} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`)

    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((obj) => {
        offsets.push(pdf.length)
        pdf += `${obj}\n`
    })
    const xrefStart = pdf.length
    pdf += `xref\n0 ${offsets.length}\n`
    pdf += '0000000000 65535 f \n'
    for (let i = 1; i < offsets.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
    }
    pdf += `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
    return new Blob([pdf], { type: 'application/pdf' })
}

const buildProductsCsv = (products) => {
    const generatedAt = new Date().toISOString()
    const categoryMap = {}
    products.forEach((p) => {
        const cat = p.category || 'other'
        if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalStock: 0, totalValue: 0 }
        categoryMap[cat].count += 1
        categoryMap[cat].totalStock += Number(p.stock || 0)
        categoryMap[cat].totalValue += Number(p.price || 0) * Number(p.stock || 0)
    })

    const rows = [
        ['PARAMOUNT GS - PRODUCTS SUMMARY REPORT'],
        ['Generated:', generatedAt],
        ['Total Products:', products.length],
        [],
        ['CATEGORY SUMMARY'],
        ['Category', 'Product Count', 'Total Stock', 'Inventory Value (PHP)'],
        ...Object.entries(categoryMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, s]) => [cat.charAt(0).toUpperCase() + cat.slice(1), s.count, s.totalStock, fmtMoney(s.totalValue)]),
        [],
        ['PRODUCT LIST'],
        ['Name', 'Category', 'Price (PHP)', 'Stock', 'Status'],
        ...products
            .slice()
            .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
            .map((p) => {
                const stock = Number(p.stock || 0)
                const status = stock > 5 ? 'In Stock' : (stock > 0 ? 'Low Stock' : 'Out of Stock')
                return [p.name, (p.category || 'other').charAt(0).toUpperCase() + (p.category || 'other').slice(1), fmtMoney(p.price), stock, status]
            }),
    ]

    return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

const buildOrdersCsv = (orders) => {
    const generatedAt = new Date().toISOString()
    const statusMap = {}
    let totalRevenue = 0
    let deliveredRevenue = 0

    orders.forEach((o) => {
        const status = o.status || 'pending'
        statusMap[status] = (statusMap[status] || 0) + 1
        const total = Number(o.total_price || 0)
        totalRevenue += total
        if (status === 'delivered') deliveredRevenue += total
    })

    const rows = [
        ['PARAMOUNT GS - ORDERS SUMMARY REPORT'],
        ['Generated:', generatedAt],
        ['Total Orders:', orders.length],
        ['Total Revenue (PHP):', fmtMoney(totalRevenue)],
        ['Delivered Revenue (PHP):', fmtMoney(deliveredRevenue)],
        [],
        ['STATUS BREAKDOWN'],
        ['Status', 'Count'],
        ...Object.entries(statusMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([status, count]) => [status.charAt(0).toUpperCase() + status.slice(1), count]),
        [],
        ['ORDER LIST'],
        ['Order ID', 'Customer', 'Email', 'Items', 'Total (PHP)', 'Status', 'Date'],
        ...orders
            .slice()
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .map((o) => [
                String(o.id).slice(-8).toUpperCase(),
                o.user_name || '',
                o.user_email || '',
                (o.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
                fmtMoney(o.total_price),
                (o.status || 'pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1),
                o.created_at ? String(o.created_at).slice(0, 10) : '',
            ]),
    ]

    return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

const buildProductsPdfLines = (products) => {
    const generatedAt = new Date().toISOString()
    const categoryMap = {}
    products.forEach((p) => {
        const cat = p.category || 'other'
        if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalStock: 0, totalValue: 0 }
        categoryMap[cat].count += 1
        categoryMap[cat].totalStock += Number(p.stock || 0)
        categoryMap[cat].totalValue += Number(p.price || 0) * Number(p.stock || 0)
    })

    const lines = [
        'PARAMOUNT GS',
        'Products Summary Report',
        `Generated: ${generatedAt}`,
        `Total Products: ${products.length}`,
        '',
        'CATEGORY SUMMARY',
    ]

    Object.entries(categoryMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([cat, s]) => {
            lines.push(`${cat.toUpperCase()} | Products: ${s.count} | Stock: ${s.totalStock} | Inventory Value: PHP ${fmtMoney(s.totalValue)}`)
        })

    lines.push('', 'PRODUCT LIST')
    products
        .slice()
        .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
        .forEach((p) => {
            const stock = Number(p.stock || 0)
            const status = stock > 5 ? 'In Stock' : (stock > 0 ? 'Low Stock' : 'Out of Stock')
            lines.push(`${p.name} | ${(p.category || 'other').toUpperCase()} | PHP ${fmtMoney(p.price)} | Stock: ${stock} | ${status}`)
        })

    return lines
}

const buildOrdersPdfLines = (orders) => {
    const generatedAt = new Date().toISOString()
    const statusMap = {}
    let totalRevenue = 0
    let deliveredRevenue = 0

    orders.forEach((o) => {
        const status = o.status || 'pending'
        statusMap[status] = (statusMap[status] || 0) + 1
        const total = Number(o.total_price || 0)
        totalRevenue += total
        if (status === 'delivered') deliveredRevenue += total
    })

    const lines = [
        'PARAMOUNT GS',
        'Orders Summary Report',
        `Generated: ${generatedAt}`,
        `Total Orders: ${orders.length}`,
        `Total Revenue: PHP ${fmtMoney(totalRevenue)}`,
        `Delivered Revenue: PHP ${fmtMoney(deliveredRevenue)}`,
        '',
        'STATUS BREAKDOWN',
    ]

    Object.entries(statusMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([status, count]) => {
            lines.push(`${status.toUpperCase()} | Count: ${count}`)
        })

    lines.push('', 'ORDER LIST')
    orders
        .slice()
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .forEach((o) => {
            const itemCount = (o.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            const date = o.created_at ? String(o.created_at).slice(0, 10) : ''
            lines.push(`${String(o.id).slice(-8).toUpperCase()} | ${o.user_name || ''} | ${o.user_email || ''} | Items: ${itemCount} | PHP ${fmtMoney(o.total_price)} | ${(o.status || 'pending').toUpperCase()} | ${date}`)
        })

    return lines
}

export const downloadReport = async (type, format) => {
    if (type === 'products') {
        const { data } = await api.get('/products/', { params: { page_size: 0 } })
        const products = data.results || []
        if (format === 'csv') {
            downloadBlob(new Blob([buildProductsCsv(products)], { type: 'text/csv;charset=utf-8' }), 'paramount_products_report.csv')
            return
        }
        downloadBlob(makeSimplePdfBlob(buildProductsPdfLines(products)), 'paramount_products_report.pdf')
        return
    }

    if (type === 'orders') {
        const { data } = await api.get('/orders/')
        const orders = Array.isArray(data) ? data : []
        if (format === 'csv') {
            downloadBlob(new Blob([buildOrdersCsv(orders)], { type: 'text/csv;charset=utf-8' }), 'paramount_orders_report.csv')
            return
        }
        downloadBlob(makeSimplePdfBlob(buildOrdersPdfLines(orders)), 'paramount_orders_report.pdf')
        return
    }

    throw new Error('Invalid report type')
}

export default api

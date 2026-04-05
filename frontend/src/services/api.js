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

const formatReportDate = (value = new Date()) => new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

const wrapPdfText = (text, maxChars = 92) => {
    const source = String(text ?? '')
    if (!source) return ['']
    const words = source.split(/\s+/)
    const lines = []
    let current = ''

    words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word
        if (candidate.length <= maxChars) {
            current = candidate
            return
        }
        if (current) lines.push(current)
        if (word.length <= maxChars) {
            current = word
            return
        }
        for (let i = 0; i < word.length; i += maxChars) {
            const chunk = word.slice(i, i + maxChars)
            if (chunk.length === maxChars) lines.push(chunk)
            else current = chunk
        }
    })

    if (current) lines.push(current)
    return lines.length ? lines : ['']
}

const pushWrappedText = (target, text, options = {}) => {
    const maxChars = options.maxChars ?? 92
    const wrapped = wrapPdfText(text, maxChars)
    wrapped.forEach((line, index) => {
        target.push({
            ...options,
            text: line,
            marginTop: index === 0 ? (options.marginTop ?? 0) : 0,
        })
    })
}

const makeStyledPdfBlob = (elements) => {
    const pageWidth = 612
    const pageHeight = 792
    const marginX = 42
    const topMargin = 48
    const bottomMargin = 42
    const pages = []
    let current = []
    let y = pageHeight - topMargin

    const ensureSpace = (needed = 16) => {
        if (y - needed < bottomMargin) {
            pages.push(current)
            current = []
            y = pageHeight - topMargin
        }
    }

    elements.forEach((element) => {
        if (element.type === 'spacer') {
            ensureSpace(element.height ?? 12)
            y -= element.height ?? 12
            return
        }

        if (element.type === 'divider') {
            ensureSpace((element.marginTop ?? 6) + 8)
            y -= element.marginTop ?? 6
            current.push({
                type: 'line',
                x1: marginX,
                x2: pageWidth - marginX,
                y,
                color: element.color || 'D2D2D7',
                width: element.width ?? 1,
            })
            y -= 8
            return
        }

        if (element.type === 'box') {
            const labelLines = element.label ? wrapPdfText(element.label, element.labelMaxChars ?? 72) : []
            const valueLines = element.value ? wrapPdfText(element.value, element.valueMaxChars ?? 76) : []
            const contentLines = labelLines.length + valueLines.length
            const boxHeight = element.height ?? Math.max(54, 20 + (contentLines * 14))
            ensureSpace((element.marginTop ?? 0) + boxHeight + 8)
            y -= element.marginTop ?? 0
            current.push({
                type: 'rect',
                x: marginX,
                y: y - boxHeight,
                width: pageWidth - (marginX * 2),
                height: boxHeight,
                fill: element.fill || 'F5F5F7',
            })
            labelLines.forEach((line, index) => {
                current.push({
                    type: 'text',
                    x: marginX + 14,
                    y: y - 18 - (index * 12),
                    text: line,
                    size: 9,
                    color: element.labelColor || '6E6E73',
                })
            })
            valueLines.forEach((line, index) => {
                current.push({
                    type: 'text',
                    x: marginX + 14,
                    y: y - 18 - (labelLines.length * 12) - 6 - (index * 14),
                    text: line,
                    size: element.valueSize ?? 12,
                    color: element.valueColor || '111111',
                })
            })
            y -= boxHeight + 10
            return
        }

        if (element.type === 'text') {
            const size = element.size ?? 10
            const lineHeight = element.lineHeight ?? (size + 4)
            ensureSpace((element.marginTop ?? 0) + lineHeight)
            y -= element.marginTop ?? 0
            current.push({
                type: 'text',
                x: element.x ?? marginX,
                y,
                text: element.text,
                size,
                color: element.color || '111111',
            })
            y -= lineHeight
        }
    })

    if (current.length || !pages.length) pages.push(current)

    const pageStreams = pages.map((items, pageIndex) => {
        let stream = ''

        // Header accent bar
        stream += '0.49 0.23 0.92 rg\n'
        stream += `${marginX} ${pageHeight - 28} ${pageWidth - (marginX * 2)} 4 re f\n`

        // Footer page number
        stream += 'BT\n/F1 9 Tf\n0.56 0.56 0.58 rg\n'
        stream += `1 0 0 1 ${pageWidth - 90} 20 Tm (Page ${pageIndex + 1}) Tj\nET\n`

        items.forEach((item) => {
            if (item.type === 'rect') {
                const rgb = item.fill.match(/.{1,2}/g).map((part) => Number.parseInt(part, 16) / 255)
                stream += `${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg\n`
                stream += `${item.x} ${item.y} ${item.width} ${item.height} re f\n`
                return
            }
            if (item.type === 'line') {
                const rgb = item.color.match(/.{1,2}/g).map((part) => Number.parseInt(part, 16) / 255)
                stream += `${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} RG\n`
                stream += `${item.width} w\n${item.x1} ${item.y} m ${item.x2} ${item.y} l S\n`
                return
            }
            if (item.type === 'text') {
                const rgb = item.color.match(/.{1,2}/g).map((part) => Number.parseInt(part, 16) / 255)
                stream += 'BT\n'
                stream += `/F1 ${item.size} Tf\n`
                stream += `${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg\n`
                stream += `1 0 0 1 ${item.x} ${item.y} Tm (${escapePdfText(item.text)}) Tj\n`
                stream += 'ET\n'
            }
        })

        return stream
    })

    const objects = []
    objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
    const kids = pageStreams.map((_, i) => `${3 + i * 2} 0 R`).join(' ')
    objects.push(`2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pageStreams.length} >> endobj`)

    pageStreams.forEach((stream, i) => {
        const pageObjNum = 3 + i * 2
        const contentObjNum = pageObjNum + 1
        objects.push(`${pageObjNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 ${3 + pageStreams.length * 2} 0 R >> >> /Contents ${contentObjNum} 0 R >> endobj`)
        objects.push(`${contentObjNum} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`)
    })

    const fontObjNum = 3 + pageStreams.length * 2
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
    const generatedAt = formatReportDate()
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
    const generatedAt = formatReportDate()
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

const buildProductsPdfElements = (products) => {
    const generatedAt = formatReportDate()
    const categoryMap = {}
    let totalInventoryValue = 0
    products.forEach((p) => {
        const cat = p.category || 'other'
        if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalStock: 0, totalValue: 0 }
        categoryMap[cat].count += 1
        categoryMap[cat].totalStock += Number(p.stock || 0)
        categoryMap[cat].totalValue += Number(p.price || 0) * Number(p.stock || 0)
        totalInventoryValue += Number(p.price || 0) * Number(p.stock || 0)
    })

    const elements = [
        { type: 'text', text: 'PARAMOUNT GS', size: 22, color: '111111' },
        { type: 'text', text: 'Products Summary Report', size: 14, color: '7C3AED', marginTop: 2 },
        { type: 'text', text: `Generated ${generatedAt}`, size: 9, color: '6E6E73', marginTop: 4 },
        { type: 'spacer', height: 8 },
        { type: 'box', label: 'Total Products', value: String(products.length), fill: 'EEF4FF' },
        { type: 'box', label: 'Inventory Value', value: `PHP ${fmtMoney(totalInventoryValue)}`, fill: 'F5EDFF' },
        { type: 'text', text: 'Category Summary', size: 13, color: '111111', marginTop: 4 },
        { type: 'divider', marginTop: 4, color: 'D9D9E3' },
    ]

    Object.entries(categoryMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([cat, s]) => {
            pushWrappedText(
                elements,
                `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${s.count} product(s), ${s.totalStock} total stock, inventory value PHP ${fmtMoney(s.totalValue)}`,
                { type: 'text', size: 10, color: '333333', marginTop: 2, maxChars: 86 }
            )
        })

    elements.push({ type: 'spacer', height: 8 })
    elements.push({ type: 'text', text: 'Product List', size: 13, color: '111111' })
    elements.push({ type: 'divider', marginTop: 4, color: 'D9D9E3' })

    products
        .slice()
        .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
        .forEach((p) => {
            const stock = Number(p.stock || 0)
            const status = stock > 5 ? 'In Stock' : (stock > 0 ? 'Low Stock' : 'Out of Stock')
            elements.push({
                type: 'box',
                label: p.name,
                value: `${(p.category || 'other').toUpperCase()} | PHP ${fmtMoney(p.price)} | Stock ${stock} | ${status}`,
                fill: 'FAFAFC',
                marginTop: 2,
                valueSize: 10,
            })
        })

    return elements
}

const buildOrdersPdfElements = (orders) => {
    const generatedAt = formatReportDate()
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

    const elements = [
        { type: 'text', text: 'PARAMOUNT GS', size: 22, color: '111111' },
        { type: 'text', text: 'Orders Summary Report', size: 14, color: '7C3AED', marginTop: 2 },
        { type: 'text', text: `Generated ${generatedAt}`, size: 9, color: '6E6E73', marginTop: 4 },
        { type: 'spacer', height: 8 },
        { type: 'box', label: 'Total Orders', value: String(orders.length), fill: 'EEF9F0' },
        { type: 'box', label: 'Total Revenue', value: `PHP ${fmtMoney(totalRevenue)}`, fill: 'FFF7E8' },
        { type: 'box', label: 'Delivered Revenue', value: `PHP ${fmtMoney(deliveredRevenue)}`, fill: 'EEF4FF' },
        { type: 'text', text: 'Status Breakdown', size: 13, color: '111111', marginTop: 4 },
        { type: 'divider', marginTop: 4, color: 'D9D9E3' },
    ]

    Object.entries(statusMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([status, count]) => {
            pushWrappedText(
                elements,
                `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} order(s)`,
                { type: 'text', size: 10, color: '333333', marginTop: 2, maxChars: 86 }
            )
        })

    elements.push({ type: 'spacer', height: 8 })
    elements.push({ type: 'text', text: 'Order List', size: 13, color: '111111' })
    elements.push({ type: 'divider', marginTop: 4, color: 'D9D9E3' })

    orders
        .slice()
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .forEach((o) => {
            const itemCount = (o.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            const date = o.created_at ? String(o.created_at).slice(0, 10) : ''
            elements.push({
                type: 'box',
                label: `Order ${String(o.id).slice(-8).toUpperCase()} • ${o.user_name || 'Customer'}`,
                value: `${o.user_email || ''} | ${itemCount} item(s) | PHP ${fmtMoney(o.total_price)} | ${(o.status || 'pending').toUpperCase()} | ${date}`,
                fill: 'FAFAFC',
                marginTop: 2,
                valueSize: 10,
            })
        })

    return elements
}

export const downloadReport = async (type, format) => {
    if (type === 'products') {
        const { data } = await api.get('/products/', { params: { page_size: 0 } })
        const products = data.results || []
        if (format === 'csv') {
            downloadBlob(new Blob([buildProductsCsv(products)], { type: 'text/csv;charset=utf-8' }), 'paramount_products_report.csv')
            return
        }
        downloadBlob(makeStyledPdfBlob(buildProductsPdfElements(products)), 'paramount_products_report.pdf')
        return
    }

    if (type === 'orders') {
        const { data } = await api.get('/orders/')
        const orders = Array.isArray(data) ? data : []
        if (format === 'csv') {
            downloadBlob(new Blob([buildOrdersCsv(orders)], { type: 'text/csv;charset=utf-8' }), 'paramount_orders_report.csv')
            return
        }
        downloadBlob(makeStyledPdfBlob(buildOrdersPdfElements(orders)), 'paramount_orders_report.pdf')
        return
    }

    throw new Error('Invalid report type')
}

export default api

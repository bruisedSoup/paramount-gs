import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, deleteProduct } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Eye, Trash2, X, Search } from 'lucide-react'

const CATEGORIES = ['All', 'phones', 'laptops', 'tablets', 'accessories', 'audio', 'cameras', 'gaming', 'other']
const BLANK = { name: '', description: '', price: '', stock: '', category: 'phones' }

const T = {
    bg: '#f5f5f7',
    card: '#ffffff',
    border: '#d2d2d7',
    text: '#111111',
    subtext: '#6e6e73',
    muted: '#8f8f94',
    accent: '#0066cc',
    accentHover: '#0077ed',
    accent2: '#34c759',
}

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(BLANK)
    const [imageFile, setImageFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    const load = async () => {
        try {
            const { data } = await getProducts({})
            setProducts(data.results || data)
        } catch {
            toast.error('Failed to load products')
        }
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        let filtered = products

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(p => (p.category || '').toLowerCase() === selectedCategory.toLowerCase())
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        }

        setFilteredProducts(filtered)
    }, [products, selectedCategory, searchQuery])

    const openNew = () => {
        setForm(BLANK)
        setImageFile(null)
        setShowModal(true)
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation()
        if (!confirm('Delete this product?')) return
        try {
            await deleteProduct(id)
            toast.success('Product deleted')
            load()
        } catch {
            toast.error('Delete failed')
        }
    }

    const getCategoryStats = () => {
        const stats = {}
        CATEGORIES.forEach(cat => {
            if (cat === 'All') return
            stats[cat] = products.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length
        })
        return stats
    }

    const categoryStats = getCategoryStats()
    const IS = { width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', color: T.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
    const LS = { display: 'block', color: T.muted, fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: T.bg, paddingBottom: '60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: T.text, margin: 0, letterSpacing: '-0.02em' }}>Products</h1>
                    <button onClick={openNew} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
                        <Plus size={18} /> Add Product
                    </button>
                </div>

                {/* Search and filter section */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '20px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {/* Search bar */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ ...IS, paddingLeft: '40px', paddingRight: '14px' }}
                            />
                        </div>
                    </div>

                    {/* Category filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {CATEGORIES.map(cat => {
                            const count = cat === 'All' ? products.length : categoryStats[cat] || 0
                            const isSelected = selectedCategory === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        background: isSelected ? T.accent : '#f5f5f7',
                                        color: isSelected ? '#fff' : T.text,
                                        border: `1px solid ${isSelected ? T.accent : T.border}`,
                                        borderRadius: '10px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) e.target.style.backgroundColor = '#e8e8ed'
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) e.target.style.backgroundColor = '#f5f5f7'
                                    }}
                                >
                                    {cat}
                                    <span style={{ background: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '2px 8px', fontSize: '12px', fontWeight: '700', minWidth: '22px', textAlign: 'center' }}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Products table or grid */}
                {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '16px' }}>
                        <p style={{ fontSize: '42px', marginBottom: '12px' }}>📦</p>
                        <p style={{ color: T.text, fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>No products found</p>
                        <p style={{ color: T.muted, fontSize: '14px' }}>
                            {selectedCategory !== 'All' || searchQuery ? 'Try adjusting your filters' : 'Get started by adding your first product'}
                        </p>
                    </div>
                ) : (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: '#fafafa' }}>
                                        {['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: T.muted, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((p, idx) => (
                                        <tr key={p.id} style={{ borderBottom: idx < filteredProducts.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => navigate(`/admin/products/${p.id}`)}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <img src={p.image_url || 'https://via.placeholder.com/50'} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${T.border}` }} />
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <p style={{ color: T.text, fontWeight: '600', fontSize: '14px', margin: 0 }}>{p.name}</p>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: T.muted, fontSize: '14px', textTransform: 'capitalize' }}>{p.category}</td>
                                            <td style={{ padding: '12px 16px', color: T.accent, fontWeight: '700', fontSize: '14px' }}>₱{parseFloat(p.price).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ background: p.stock > 5 ? 'rgba(52, 199, 89, 0.1)' : p.stock > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: p.stock > 5 ? T.accent2 : p.stock > 0 ? '#f59e0b' : '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={e => { e.stopPropagation(); navigate(`/admin/products/${p.id}`) }}
                                                        style={{ background: 'rgba(0, 102, 204, 0.1)', color: T.accent, border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.background = 'rgba(0, 102, 204, 0.2)' }} onMouseLeave={e => { e.target.style.background = 'rgba(0, 102, 204, 0.1)' }}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={e => handleDelete(e, p.id)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.background = 'rgba(239, 68, 68, 0.2)' }} onMouseLeave={e => { e.target.style.background = 'rgba(239, 68, 68, 0.1)' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create product modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(8px)' }}>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ color: T.text, fontWeight: '800', fontSize: '20px', margin: 0 }}>New Product</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            {[
                                { key: 'name', label: 'Product Name', type: 'text' },
                                { key: 'price', label: 'Price (₱)', type: 'number' },
                                { key: 'stock', label: 'Stock', type: 'number' },
                            ].map(f => (
                                <div key={f.key} style={{ marginBottom: '14px' }}>
                                    <label style={LS}>{f.label}</label>
                                    <input style={IS} type={f.type} value={form[f.key] || ''}
                                        onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                </div>
                            ))}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={LS}>Category</label>
                                <select style={IS} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {['phones', 'laptops', 'tablets', 'accessories', 'audio', 'cameras', 'gaming', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={LS}>Description</label>
                                <textarea rows={3} style={{ ...IS, resize: 'vertical' }} value={form.description || ''}
                                    onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={LS}>Product Image</label>
                                <input type="file" accept="image/*" style={{ color: T.muted, fontSize: '14px' }}
                                    onChange={e => setImageFile(e.target.files[0])} />
                            </div>
                            <button onClick={async () => {
                                setLoading(true)
                                try {
                                    const fd = new FormData()
                                    const fields = ['name', 'description', 'price', 'stock', 'category']
                                    fields.forEach(k => { if (form[k] !== '' && form[k] !== null) fd.append(k, form[k]) })
                                    if (imageFile instanceof File) fd.append('image', imageFile)
                                    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/products/`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                                        body: fd
                                    })
                                    toast.success('Product created!')
                                    setShowModal(false)
                                    load()
                                } catch {
                                    toast.error('Save failed')
                                } finally { setLoading(false) }
                            }} disabled={loading} style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
                                {loading ? 'Creating...' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, createProduct, deleteProduct } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Eye, Trash2, X } from 'lucide-react'

const BLANK = { name: '', description: '', price: '', stock: '', category: 'phones' }

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(BLANK)
    const [imageFile, setImageFile] = useState(null)
    const [loading, setLoading] = useState(false)

    const load = () => getProducts().then(r => setProducts(r.data.results || r.data))
    useEffect(() => { load() }, [])

    const openNew = () => { setForm(BLANK); setImageFile(null); setShowModal(true) }

    const handleSave = async () => {
        setLoading(true)
        try {
            const fd = new FormData()
            const fields = ['name', 'description', 'price', 'stock', 'category']
            fields.forEach(k => { if (form[k] !== '' && form[k] !== null) fd.append(k, form[k]) })
            if (imageFile instanceof File) fd.append('image', imageFile)
            await createProduct(fd)
            toast.success('Product created!')
            setShowModal(false)
            load()
        } catch (err) {
            console.error(err.response?.data)
            toast.error(err.response?.data?.detail || 'Save failed')
        } finally { setLoading(false) }
    }

    const handleDelete = async (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('Delete this product?')) return
        try {
            await deleteProduct(id)
            toast.success('Deleted')
            load()
        } catch { toast.error('Delete failed') }
    }

    const IS = { width: '100%', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
    const LS = { display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800' }}>Products</h1>
                <button onClick={openNew} style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                            {['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <img src={p.image_url || 'https://via.placeholder.com/50'} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <Link to={`/admin/products/${p.id}`} style={{ color: '#fff', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}
                                        onMouseEnter={e => e.target.style.color = '#00e5ff'}
                                        onMouseLeave={e => e.target.style.color = '#fff'}>
                                        {p.name}
                                    </Link>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.category}</td>
                                <td style={{ padding: '12px 16px', color: '#00e5ff', fontWeight: '700' }}>₱{parseFloat(p.price).toLocaleString()}</td>
                                <td style={{ padding: '12px 16px', color: p.stock > 0 ? '#10b981' : '#ef4444' }}>{p.stock}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Link to={`/admin/products/${p.id}`}
                                            style={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                                            title="View Details">
                                            <Eye size={14} />
                                        </Link>
                                        <button onClick={e => handleDelete(e, p.id)}
                                            style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                                            title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create product modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>New Product</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
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
                            <input type="file" accept="image/*" style={{ color: '#94a3b8', fontSize: '14px' }}
                                onChange={e => setImageFile(e.target.files[0])} />
                        </div>
                        <button onClick={handleSave} disabled={loading}
                            style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                            {loading ? 'Saving...' : 'Create Product'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
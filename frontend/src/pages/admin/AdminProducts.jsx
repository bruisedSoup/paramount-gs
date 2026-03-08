import { useState, useEffect } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct, createProductUpdate, getProductUpdates } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, X, Megaphone } from 'lucide-react'

const BLANK = { name: '', description: '', price: '', stock: '', category: 'phones' }

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [showUpdate, setShowUpdate] = useState(null) // product
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(BLANK)
    const [imageFile, setImageFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [updateForm, setUpdateForm] = useState({ title: '', body: '' })
    const [posting, setPosting] = useState(false)
    const [prevUpdates, setPrevUpdates] = useState([])

    const load = () => getProducts().then(r => setProducts(r.data.results || r.data))
    useEffect(() => { load() }, [])

    const openNew = () => { setEditing(null); setForm(BLANK); setImageFile(null); setShowModal(true) }
    const openEdit = (p) => {
        setEditing(p)
        setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category })
        setImageFile(null)
        setShowModal(true)
    }
    const openUpdate = async (p) => {
        setShowUpdate(p)
        setUpdateForm({ title: '', body: '' })
        try {
            const { data } = await getProductUpdates(p.id)
            setPrevUpdates(data)
        } catch { setPrevUpdates([]) }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const fd = new FormData()
            const fields = ['name', 'description', 'price', 'stock', 'category']
            fields.forEach(k => {
                if (form[k] !== null && form[k] !== undefined && form[k] !== '') fd.append(k, form[k])
            })
            if (imageFile instanceof File) fd.append('image', imageFile)

            if (editing) { await updateProduct(editing.id, fd) }
            else { await createProduct(fd) }
            toast.success(editing ? 'Product updated!' : 'Product created!')
            setShowModal(false)
            load()
        } catch (err) {
            console.error(err.response?.data)
            toast.error(err.response?.data?.detail || 'Save failed')
        } finally { setLoading(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return
        await deleteProduct(id)
        toast.success('Deleted')
        load()
    }

    const handlePostUpdate = async () => {
        if (!updateForm.title.trim() || !updateForm.body.trim()) return toast.error('Title and body required')
        setPosting(true)
        try {
            const { data } = await createProductUpdate(showUpdate.id, updateForm)
            setPrevUpdates(prev => [data, ...prev])
            setUpdateForm({ title: '', body: '' })
            toast.success('Update posted!')
        } catch {
            toast.error('Failed to post update')
        } finally { setPosting(false) }
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
                                <td style={{ padding: '12px 16px' }}><img src={p.image_url || 'https://via.placeholder.com/50'} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} /></td>
                                <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '600' }}>{p.name}</td>
                                <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.category}</td>
                                <td style={{ padding: '12px 16px', color: '#00e5ff', fontWeight: '700' }}>₱{parseFloat(p.price).toLocaleString()}</td>
                                <td style={{ padding: '12px 16px', color: p.stock > 0 ? '#10b981' : '#ef4444' }}>{p.stock}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => openEdit(p)} style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }} title="Edit"><Edit size={14} /></button>
                                        <button onClick={() => openUpdate(p)} style={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }} title="Post Update"><Megaphone size={14} /></button>
                                        <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }} title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Product edit/create modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>{editing ? 'Edit Product' : 'New Product'}</h2>
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
                            {loading ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>
            )}

            {/* Product update modal */}
            {showUpdate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>Post Update</h2>
                            <button onClick={() => setShowUpdate(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>{showUpdate.name}</p>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={LS}>Update Title</label>
                            <input style={IS} value={updateForm.title} onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. New color available, Price drop, Stock update..." />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={LS}>Message</label>
                            <textarea rows={4} style={{ ...IS, resize: 'vertical' }} value={updateForm.body} onChange={e => setUpdateForm(f => ({ ...f, body: e.target.value }))} placeholder="Share details about this update..." />
                        </div>
                        <button onClick={handlePostUpdate} disabled={posting}
                            style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginBottom: '24px' }}>
                            {posting ? 'Posting...' : '📢 Post Update'}
                        </button>

                        {/* Previous updates */}
                        {prevUpdates.length > 0 && (
                            <>
                                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Previous Updates</p>
                                {prevUpdates.map(u => (
                                    <div key={u.id} style={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <p style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '14px' }}>{u.title}</p>
                                            <p style={{ color: '#334155', fontSize: '11px' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>{u.body}</p>
                                        <p style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>{u.comments.length} comment{u.comments.length !== 1 ? 's' : ''}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    getProduct, updateProduct, deleteProduct,
    getProductReviews, replyToReview,
    getProductUpdates, createProductUpdate,
} from '../../services/api'
import toast from 'react-hot-toast'
import {
    Edit, Trash2, Megaphone, ArrowLeft, Star, MessageSquare,
    X, Send, ChevronDown, ChevronUp, Package, TrendingUp,
    BarChart2, Tag, Layers
} from 'lucide-react'

// ── Shared styles ─────────────────────────────────────────
const IS = { width: '100%', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const LS = { display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }
const MODAL_BG = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }
const MODAL = { background: '#111118', border: '1px solid #1e1e2e', borderRadius: '14px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }

function StarDisplay({ value, size = 13 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size} fill={value >= n ? '#f59e0b' : 'none'} color={value >= n ? '#f59e0b' : '#334155'} />
            ))}
        </div>
    )
}

// ── Edit Product Modal ────────────────────────────────────
function EditModal({ product, onClose, onSaved }) {
    const [form, setForm] = useState({ name: product.name, description: product.description, price: product.price, stock: product.stock, category: product.category })
    const [imgFile, setImgFile] = useState(null)
    const [loading, setLoading] = useState(false)

    const save = async () => {
        setLoading(true)
        try {
            const fd = new FormData()
            Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
            if (imgFile) fd.append('image', imgFile)
            const { data } = await updateProduct(product.id, fd)
            toast.success('Product updated!')
            onSaved(data)
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Save failed')
        } finally { setLoading(false) }
    }

    return (
        <div style={MODAL_BG}>
            <div style={MODAL}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>Edit Product</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                {[
                    { key: 'name', label: 'Product Name', type: 'text' },
                    { key: 'price', label: 'Price (₱)', type: 'number' },
                    { key: 'stock', label: 'Stock', type: 'number' },
                ].map(f => (
                    <div key={f.key} style={{ marginBottom: '14px' }}>
                        <label style={LS}>{f.label}</label>
                        <input style={IS} type={f.type} value={form[f.key] || ''}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                ))}
                <div style={{ marginBottom: '14px' }}>
                    <label style={LS}>Category</label>
                    <select style={IS} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                        {['phones', 'laptops', 'tablets', 'accessories', 'audio', 'cameras', 'gaming', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: '14px' }}>
                    <label style={LS}>Description</label>
                    <textarea rows={3} style={{ ...IS, resize: 'vertical' }} value={form.description || ''}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={LS}>Product Image</label>
                    {product.image_url && <img src={product.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px', display: 'block', border: '1px solid #1e1e2e' }} />}
                    <input type="file" accept="image/*" style={{ color: '#94a3b8', fontSize: '13px' }}
                        onChange={e => setImgFile(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#1e1e2e', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '11px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                    <button onClick={save} disabled={loading} style={{ flex: 2, background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: '800', cursor: 'pointer' }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Post Update Modal ─────────────────────────────────────
function UpdateModal({ product, onClose, onPosted }) {
    const [form, setForm] = useState({ title: '', body: '' })
    const [loading, setLoading] = useState(false)

    const post = async () => {
        if (!form.title.trim() || !form.body.trim()) return toast.error('Title and message required')
        setLoading(true)
        try {
            const { data } = await createProductUpdate(product.id, form)
            toast.success('Update posted!')
            onPosted(data)
            onClose()
        } catch { toast.error('Failed to post update') }
        finally { setLoading(false) }
    }

    return (
        <div style={MODAL_BG}>
            <div style={MODAL}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>Post Update</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <p style={{ color: '#475569', fontSize: '13px', marginBottom: '24px' }}>{product.name}</p>
                <div style={{ marginBottom: '14px' }}>
                    <label style={LS}>Update Title</label>
                    <input style={IS} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. New color available, Price drop..." />
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={LS}>Message</label>
                    <textarea rows={5} style={{ ...IS, resize: 'vertical' }} value={form.body}
                        onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                        placeholder="Share details about this update..." />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#1e1e2e', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '11px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                    <button onClick={post} disabled={loading} style={{ flex: 2, background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: '800', cursor: 'pointer' }}>
                        {loading ? 'Posting...' : '📢 Post Update'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Review Card with reply ────────────────────────────────
function ReviewCard({ review, onReplied }) {
    const [replyText, setReplyText] = useState('')
    const [posting, setPosting] = useState(false)
    const [showReply, setShowReply] = useState(false)

    const submitReply = async () => {
        if (!replyText.trim()) return
        setPosting(true)
        try {
            const { data } = await replyToReview(review.id, replyText)
            toast.success('Reply posted!')
            onReplied(data)
            setReplyText('')
            setShowReply(false)
        } catch { toast.error('Failed to post reply') }
        finally { setPosting(false) }
    }

    return (
        <div style={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                    <p style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{review.user_name}</p>
                    <StarDisplay value={review.rating} />
                </div>
                <span style={{ color: '#334155', fontSize: '11px' }}>
                    {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>
            {review.body && <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: review.image_urls?.length ? '10px' : 0 }}>{review.body}</p>}
            {review.image_urls?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {review.image_urls.map((url, i) => (
                        <img key={i} src={url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1e1e2e', cursor: 'pointer' }}
                            onClick={() => window.open(url, '_blank')} />
                    ))}
                </div>
            )}
            {review.reply ? (
                <div style={{ background: '#111118', borderRadius: '8px', padding: '10px 12px', borderLeft: '3px solid #00e5ff', marginTop: '10px' }}>
                    <p style={{ color: '#00e5ff', fontSize: '11px', fontWeight: '700', marginBottom: '3px' }}>⚡ {review.reply.admin_name} · Admin</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{review.reply.body}</p>
                </div>
            ) : (
                <div style={{ marginTop: '10px' }}>
                    {!showReply ? (
                        <button onClick={() => setShowReply(true)}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}>
                            <MessageSquare size={12} /> Reply
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={replyText} onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitReply()}
                                placeholder="Write a reply..."
                                style={{ flex: 1, background: '#111118', border: '1px solid #1e1e2e', borderRadius: '7px', padding: '7px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }}
                                autoFocus
                            />
                            <button onClick={submitReply} disabled={posting}
                                style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '7px', padding: '7px 12px', cursor: 'pointer' }}>
                                <Send size={13} />
                            </button>
                            <button onClick={() => setShowReply(false)}
                                style={{ background: '#1e1e2e', color: '#64748b', border: 'none', borderRadius: '7px', padding: '7px 10px', cursor: 'pointer' }}>
                                <X size={13} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Update card with comments ─────────────────────────────
function UpdateCard({ update }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div style={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{update.title}</p>
                <span style={{ color: '#334155', fontSize: '11px' }}>{new Date(update.created_at).toLocaleDateString()}</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '8px' }}>{update.body}</p>
            {update.comments.length > 0 && (
                <>
                    <button onClick={() => setExpanded(e => !e)}
                        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}>
                        <MessageSquare size={12} /> {update.comments.length} comment{update.comments.length !== 1 ? 's' : ''}
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {expanded && (
                        <div style={{ marginTop: '10px', borderTop: '1px solid #1e1e2e', paddingTop: '10px' }}>
                            {update.comments.map((c, i) => (
                                <div key={i} style={{ marginBottom: '8px', background: '#111118', borderRadius: '7px', padding: '8px 10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <p style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '600' }}>{c.user_name}</p>
                                        <p style={{ color: '#334155', fontSize: '11px' }}>{new Date(c.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '13px' }}>{c.body}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ── Main Component ────────────────────────────────────────
export default function AdminProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [product, setProduct] = useState(null)
    const [reviewData, setReviewData] = useState(null)
    const [updates, setUpdates] = useState([])
    const [section, setSection] = useState('reviews')
    const [showEdit, setShowEdit] = useState(false)
    const [showUpdate, setShowUpdate] = useState(false)

    const loadAll = async () => {
        try {
            const [pRes, rRes, uRes] = await Promise.all([
                getProduct(id),
                getProductReviews(id),
                getProductUpdates(id),
            ])
            setProduct(pRes.data)
            setReviewData(rRes.data)
            setUpdates(uRes.data)
        } catch { navigate('/admin/products') }
    }

    useEffect(() => { loadAll() }, [id])

    const handleDelete = async () => {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
        try {
            await deleteProduct(id)
            toast.success('Product deleted')
            navigate('/admin/products')
        } catch { toast.error('Delete failed') }
    }

    const handleReplied = (updatedReview) => {
        setReviewData(prev => ({
            ...prev,
            reviews: prev.reviews.map(r => r.id === updatedReview.id ? updatedReview : r),
        }))
    }

    if (!product) return (
        <div style={{ textAlign: 'center', padding: '6rem', color: '#64748b' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #1e1e2e', borderTop: '3px solid #00e5ff', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    const avg = reviewData?.average || 0
    const dist = reviewData?.distribution || {}
    const total = reviewData?.total || 0

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <Link to="/admin/products" style={{ color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                    <ArrowLeft size={14} /> Products
                </Link>
                <span style={{ color: '#1e1e2e' }}>/</span>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{product.name}</span>
            </div>

            {/* Top: image + info + actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Image */}
                <div>
                    <img src={product.image_url || 'https://via.placeholder.com/280x280?text=No+Image'}
                        alt={product.name}
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '12px', border: '1px solid #1e1e2e' }} />
                </div>

                {/* Info */}
                <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {product.category}
                        </span>
                        <span style={{ background: product.stock > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: product.stock > 0 ? '#10b981' : '#ef4444', border: `1px solid ${product.stock > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                    </div>

                    <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', marginBottom: '8px', lineHeight: 1.2 }}>{product.name}</h1>

                    {total > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <StarDisplay value={avg} size={14} />
                            <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '14px' }}>{avg.toFixed(1)}</span>
                            <span style={{ color: '#475569', fontSize: '13px' }}>({total} reviews)</span>
                        </div>
                    )}

                    <p style={{ color: '#00e5ff', fontSize: '30px', fontWeight: '900', marginBottom: '12px' }}>
                        ₱{parseFloat(product.price).toLocaleString()}
                    </p>

                    <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                        {product.description}
                    </p>

                    {/* Admin stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                        {[
                            { label: 'Price', value: `₱${parseFloat(product.price).toLocaleString()}`, icon: Tag, color: '#00e5ff' },
                            { label: 'Stock', value: product.stock, icon: Layers, color: product.stock > 5 ? '#10b981' : '#f59e0b' },
                            { label: 'Reviews', value: total, icon: Star, color: '#f59e0b' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '12px' }}>
                                <s.icon size={14} color={s.color} style={{ marginBottom: '6px' }} />
                                <p style={{ color: s.color, fontSize: '20px', fontWeight: '800' }}>{s.value}</p>
                                <p style={{ color: '#334155', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => setShowEdit(true)}
                            style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Edit size={15} /> Edit Product
                        </button>
                        <button onClick={() => setShowUpdate(true)}
                            style={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Megaphone size={15} /> Post Update
                        </button>
                        <button onClick={handleDelete}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Trash2 size={15} /> Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Rating distribution bar */}
            {total > 0 && (
                <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#f59e0b', fontSize: '44px', fontWeight: '900', lineHeight: 1 }}>{avg.toFixed(1)}</p>
                            <StarDisplay value={avg} size={14} />
                            <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>{total} review{total !== 1 ? 's' : ''}</p>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            {[5, 4, 3, 2, 1].map(star => {
                                const count = dist[star] || 0
                                const pct = total ? (count / total) * 100 : 0
                                return (
                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px', width: '8px' }}>{star}</span>
                                        <Star size={10} fill='#f59e0b' color='#f59e0b' />
                                        <div style={{ flex: 1, height: '6px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                        </div>
                                        <span style={{ color: '#475569', fontSize: '12px', width: '20px', textAlign: 'right' }}>{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Section tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1e1e2e', marginBottom: '20px' }}>
                {[
                    { key: 'reviews', label: `Reviews (${total})` },
                    { key: 'updates', label: `Product Updates (${updates.length})` },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setSection(tab.key)}
                        style={{
                            background: 'none', border: 'none',
                            borderBottom: section === tab.key ? '2px solid #00e5ff' : '2px solid transparent',
                            color: section === tab.key ? '#fff' : '#475569',
                            padding: '10px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                            marginBottom: '-1px', transition: 'all 0.15s',
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reviews */}
            {section === 'reviews' && (
                <div>
                    {total === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                            <p style={{ fontSize: '36px', marginBottom: '10px' }}>⭐</p>
                            <p style={{ color: '#94a3b8', fontWeight: '600' }}>No reviews yet for this product</p>
                        </div>
                    ) : (
                        reviewData.reviews.map(r => <ReviewCard key={r.id} review={r} onReplied={handleReplied} />)
                    )}
                </div>
            )}

            {/* Updates */}
            {section === 'updates' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button onClick={() => setShowUpdate(true)}
                            style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 18px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Megaphone size={14} /> Post New Update
                        </button>
                    </div>
                    {updates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                            <p style={{ fontSize: '36px', marginBottom: '10px' }}>📢</p>
                            <p style={{ color: '#94a3b8', fontWeight: '600' }}>No updates posted yet</p>
                        </div>
                    ) : (
                        updates.map(u => <UpdateCard key={u.id} update={u} />)
                    )}
                </div>
            )}

            {/* Modals */}
            {showEdit && (
                <EditModal product={product} onClose={() => setShowEdit(false)}
                    onSaved={(updated) => setProduct(updated)} />
            )}
            {showUpdate && (
                <UpdateModal product={product} onClose={() => setShowUpdate(false)}
                    onPosted={(u) => setUpdates(prev => [u, ...prev])} />
            )}
        </div>
    )
}
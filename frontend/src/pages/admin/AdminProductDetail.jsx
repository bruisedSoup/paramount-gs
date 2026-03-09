import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    getProduct, updateProduct, deleteProduct,
    getProductReviews, replyToReview,
    getProductUpdates, createProductUpdate,
} from '../../services/api'
import toast from 'react-hot-toast'
import {
    Edit, Trash2, Megaphone, ArrowLeft, Star, MessageSquare,
    X, Send, ChevronDown, ChevronUp, Package, Tag, Layers, TrendingUp
} from 'lucide-react'

const T = {
    bg: '#f5f5f7',
    card: '#ffffff',
    border: '#d2d2d7',
    text: '#111111',
    subtext: '#6e6e73',
    muted: '#8f8f94',
    accent: '#0066cc',
    accentHover: '#0077ed',
    accent3: '#f59e0b',
    accent2: '#34c759',
}

const IS = { width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', color: T.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const LS = { display: 'block', color: T.muted, fontSize: '13px', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }
const MODAL_BG = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(8px)' }
const MODAL = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }

function StarDisplay({ value, size = 13 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size} fill={value >= n ? T.accent3 : 'none'} color={value >= n ? T.accent3 : T.border} />
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
                    <h2 style={{ color: T.text, fontWeight: '800', fontSize: '20px', margin: 0 }}>Edit Product</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={20} /></button>
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
                    {product.image_url && <img src={product.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px', display: 'block', border: `1px solid ${T.border}` }} />}
                    <input type="file" accept="image/*" style={{ color: T.muted, fontSize: '13px' }}
                        onChange={e => setImgFile(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#f5f5f7', color: T.muted, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '11px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                    <button onClick={save} disabled={loading} style={{ flex: 2, background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
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
                    <h2 style={{ color: T.text, fontWeight: '800', fontSize: '20px', margin: 0 }}>Post Update</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <p style={{ color: T.muted, fontSize: '13px', marginBottom: '24px' }}>{product.name}</p>
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
                    <button onClick={onClose} style={{ flex: 1, background: '#f5f5f7', color: T.muted, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '11px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                    <button onClick={post} disabled={loading} style={{ flex: 2, background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
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
        <div style={{ background: '#fafafa', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                    <p style={{ color: T.text, fontWeight: '700', fontSize: '14px', marginBottom: '4px', margin: 0 }}>{review.user_name}</p>
                    <StarDisplay value={review.rating} />
                </div>
                <span style={{ color: T.muted, fontSize: '11px' }}>
                    {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>
            {review.body && <p style={{ color: T.subtext, fontSize: '14px', lineHeight: '1.6', marginBottom: review.image_urls?.length ? '10px' : 0, margin: 0 }}>{review.body}</p>}
            {review.image_urls?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {review.image_urls.map((url, i) => (
                        <img key={i} src={url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${T.border}`, cursor: 'pointer' }}
                            onClick={() => window.open(url, '_blank')} />
                    ))}
                </div>
            )}
            {review.reply ? (
                <div style={{ background: 'rgba(0, 102, 204, 0.04)', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${T.accent}`, marginTop: '10px', border: `1px solid rgba(0, 102, 204, 0.15)` }}>
                    <p style={{ color: T.accent, fontSize: '12px', fontWeight: '700', marginBottom: '4px', margin: 0 }}>⚡ {review.reply.admin_name} · Admin</p>
                    <p style={{ color: T.subtext, fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{review.reply.body}</p>
                </div>
            ) : (
                <div style={{ marginTop: '10px' }}>
                    {!showReply ? (
                        <button onClick={() => setShowReply(true)}
                            style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', padding: 0, fontWeight: '600' }}>
                            <MessageSquare size={13} /> Reply
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={replyText} onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitReply()}
                                placeholder="Write a reply..."
                                style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px', color: T.text, fontSize: '13px', outline: 'none' }}
                                autoFocus
                            />
                            <button onClick={submitReply} disabled={posting}
                                style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
                                <Send size={14} />
                            </button>
                            <button onClick={() => setShowReply(false)}
                                style={{ background: '#e8e8ed', color: T.muted, border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer' }}>
                                <X size={14} />
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
        <div style={{ background: '#fafafa', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ color: T.text, fontWeight: '700', fontSize: '14px', margin: 0 }}>{update.title}</p>
                <span style={{ color: T.muted, fontSize: '11px' }}>{new Date(update.created_at).toLocaleDateString()}</span>
            </div>
            <p style={{ color: T.subtext, fontSize: '14px', lineHeight: '1.6', marginBottom: '10px', margin: 0 }}>{update.body}</p>
            {update.comments.length > 0 && (
                <>
                    <button onClick={() => setExpanded(e => !e)}
                        style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', padding: 0, fontWeight: '600' }}>
                        <MessageSquare size={13} /> {update.comments.length} comment{update.comments.length !== 1 ? 's' : ''}
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {expanded && (
                        <div style={{ marginTop: '12px', borderTop: `1px solid ${T.border}`, paddingTop: '12px' }}>
                            {update.comments.map((c, i) => (
                                <div key={i} style={{ marginBottom: '8px', background: T.bg, borderRadius: '8px', padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <p style={{ color: T.text, fontSize: '13px', fontWeight: '600', margin: 0 }}>{c.user_name}</p>
                                        <p style={{ color: T.muted, fontSize: '11px', margin: 0 }}>{new Date(c.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p style={{ color: T.subtext, fontSize: '13px', margin: 0 }}>{c.body}</p>
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
        <div style={{ textAlign: 'center', padding: '6rem', color: T.muted }}>
            <div style={{ width: '40px', height: '40px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    const avg = reviewData?.average || 0
    const dist = reviewData?.distribution || {}
    const total = reviewData?.total || 0

    return (
        <div style={{ minHeight: '100vh', backgroundColor: T.bg, paddingBottom: '60px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <Link to="/admin/products" style={{ color: T.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                        <ArrowLeft size={14} /> Products
                    </Link>
                    <span style={{ color: T.border }}>/</span>
                    <span style={{ color: T.muted, fontSize: '13px' }}>{product.name}</span>
                </div>

                {/* Top: image + info + actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Image */}
                    <div>
                        <img src={product.image_url || 'https://via.placeholder.com/280x280?text=No+Image'}
                            alt={product.name}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                    </div>

                    {/* Info */}
                    <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ background: 'rgba(0, 102, 204, 0.1)', color: T.accent, border: `1px solid rgba(0, 102, 204, 0.2)`, borderRadius: '8px', padding: '4px 12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {product.category}
                            </span>
                            <span style={{ background: product.stock > 0 ? 'rgba(52, 199, 89, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: product.stock > 0 ? T.accent2 : '#ef4444', border: product.stock > 0 ? '1px solid rgba(52, 199, 89, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '4px 12px', fontSize: '12px', fontWeight: '700' }}>
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                        </div>

                        <h1 style={{ color: T.text, fontSize: '28px', fontWeight: '900', marginBottom: '12px', lineHeight: 1.2, margin: 0 }}>{product.name}</h1>

                        {total > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <StarDisplay value={avg} size={15} />
                                <span style={{ color: T.accent3, fontWeight: '700', fontSize: '15px' }}>{avg.toFixed(1)}</span>
                                <span style={{ color: T.muted, fontSize: '13px' }}>({total} reviews)</span>
                            </div>
                        )}

                        <p style={{ color: T.accent, fontSize: '32px', fontWeight: '900', marginBottom: '16px', margin: 0 }}>
                            ₱{parseFloat(product.price).toLocaleString()}
                        </p>

                        <p style={{ color: T.subtext, fontSize: '15px', lineHeight: '1.7', marginBottom: '28px', margin: 0 }}>
                            {product.description}
                        </p>

                        {/* Admin stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
                            {[
                                { label: 'Price', value: `₱${parseFloat(product.price).toLocaleString()}`, icon: Tag, color: T.accent },
                                { label: 'Stock', value: product.stock, icon: Layers, color: product.stock > 5 ? T.accent2 : '#f59e0b' },
                                { label: 'Reviews', value: total, icon: Star, color: T.accent3 },
                            ].map(s => (
                                <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <s.icon size={16} color={s.color} style={{ marginBottom: '8px' }} />
                                    <p style={{ color: s.color, fontSize: '22px', fontWeight: '800', margin: '0 0 6px' }}>{s.value}</p>
                                    <p style={{ color: T.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', margin: 0 }}>{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => setShowEdit(true)}
                                style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
                                <Edit size={16} /> Edit
                            </button>
                            <button onClick={() => setShowUpdate(true)}
                                style={{ background: 'rgba(0, 102, 204, 0.1)', color: T.accent, border: `1px solid rgba(0, 102, 204, 0.2)`, borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.background = 'rgba(0, 102, 204, 0.2)' }} onMouseLeave={e => { e.target.style.background = 'rgba(0, 102, 204, 0.1)' }}>
                                <Megaphone size={16} /> Post Update
                            </button>
                            <button onClick={handleDelete}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.background = 'rgba(239, 68, 68, 0.2)' }} onMouseLeave={e => { e.target.style.background = 'rgba(239, 68, 68, 0.1)' }}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rating distribution bar */}
                {total > 0 && (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: T.accent3, fontSize: '48px', fontWeight: '900', lineHeight: 1, margin: '0 0 8px' }}>{avg.toFixed(1)}</p>
                                <StarDisplay value={avg} size={15} />
                                <p style={{ color: T.muted, fontSize: '13px', marginTop: '6px', margin: 0 }}>{total} review{total !== 1 ? 's' : ''}</p>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = dist[star] || 0
                                    const pct = total ? (count / total) * 100 : 0
                                    return (
                                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{ color: T.subtext, fontSize: '13px', width: '8px' }}>{star}</span>
                                            <Star size={12} fill={T.accent3} color={T.accent3} />
                                            <div style={{ flex: 1, height: '6px', background: '#e8e8ed', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: T.accent3, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                            </div>
                                            <span style={{ color: T.muted, fontSize: '13px', width: '24px', textAlign: 'right' }}>{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Section tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: '24px', gap: '24px' }}>
                    {[
                        { key: 'reviews', label: `Reviews (${total})`, icon: Star },
                        { key: 'updates', label: `Updates (${updates.length})`, icon: TrendingUp },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setSection(tab.key)}
                            style={{
                                background: 'none', border: 'none',
                                borderBottom: section === tab.key ? `2px solid ${T.accent}` : '2px solid transparent',
                                color: section === tab.key ? T.text : T.muted,
                                padding: '12px 0', cursor: 'pointer', fontWeight: section === tab.key ? '700' : '500', fontSize: '14px',
                                marginBottom: '-1px', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Reviews */}
                {section === 'reviews' && (
                    <div>
                        {total === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: T.muted }}>
                                <p style={{ fontSize: '42px', marginBottom: '12px' }}>⭐</p>
                                <p style={{ color: T.text, fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>No reviews yet</p>
                                <p style={{ fontSize: '14px' }}>Reviews will appear here once customers rate this product</p>
                            </div>
                        ) : (
                            <div>
                                {reviewData.reviews.map(r => <ReviewCard key={r.id} review={r} onReplied={handleReplied} />)}
                            </div>
                        )}
                    </div>
                )}

                {/* Updates */}
                {section === 'updates' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <button onClick={() => setShowUpdate(true)}
                                style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>
                                <Megaphone size={16} /> New Update
                            </button>
                        </div>
                        {updates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: T.muted }}>
                                <p style={{ fontSize: '42px', marginBottom: '12px' }}>📢</p>
                                <p style={{ color: T.text, fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>No updates yet</p>
                                <p style={{ fontSize: '14px' }}>Post an update to keep customers informed</p>
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
        </div>
    )
}
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, getProductReviews, getProductUpdates, commentOnUpdate, editReview } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Star, MessageCircle, ChevronDown, ChevronUp, Send, Pencil, X, ImagePlus, Info } from 'lucide-react'
import AuthPromptModal from '../components/modals/AuthPromptModal'

// ── Theme tokens ──────────────────────────────────────────
const T = {
    bg: '#f5f5f7',
    card: '#ffffff',
    border: '#d2d2d7',
    text: '#111111',
    subtext: '#6e6e73',
    muted: '#8f8f94',
    accent: '#0066cc',
    accentHover: '#0077ed',
    gold: '#f59e0b',
    green: '#1d8348',
    red: '#c0392b',
    cardShadow: '0 2px 16px rgba(0,0,0,0.08)',
}

function StarDisplay({ value, size = 16 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size} fill={value >= n ? T.gold : 'none'} color={value >= n ? T.gold : T.muted} />
            ))}
        </div>
    )
}

function StarPicker({ value, onChange }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={26}
                    fill={(hovered || value) >= n ? T.gold : 'none'}
                    color={(hovered || value) >= n ? T.gold : T.border}
                    style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(n)}
                />
            ))}
        </div>
    )
}

function RatingStats({ total, average, distribution }) {
    return (
        <div style={{ background: T.card, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                    <p style={{ color: T.gold, fontSize: '48px', fontWeight: '900', lineHeight: 1 }}>{average.toFixed(1)}</p>
                    <StarDisplay value={average} size={14} />
                    <p style={{ color: T.muted, fontSize: '12px', marginTop: '6px' }}>{total} review{total !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = distribution[star] || 0
                        const pct = total ? (count / total) * 100 : 0
                        return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ color: T.subtext, fontSize: '12px', width: '8px' }}>{star}</span>
                                <Star size={11} fill={T.gold} color={T.gold} />
                                <div style={{ flex: 1, height: '6px', background: '#e8e8ed', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: T.gold, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </div>
                                <span style={{ color: T.muted, fontSize: '12px', width: '20px', textAlign: 'right' }}>{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ── Edit Review Modal ─────────────────────────────────────
function EditReviewModal({ review, onClose, onSaved }) {
    const [rating, setRating] = useState(review.rating)
    const [body, setBody] = useState(review.body || '')
    const [images, setImages] = useState([])
    const [previews, setPreviews] = useState(review.image_urls || [])
    const [loading, setLoading] = useState(false)
    const [replaceImgs, setReplaceImgs] = useState(false)
    const fileRef = useRef()

    const addImages = (files) => {
        const chosen = Array.from(files).slice(0, 3)
        setImages(chosen)
        const newPreviews = []
        chosen.forEach(f => {
            const reader = new FileReader()
            reader.onload = e => newPreviews.push(e.target.result) && setPreviews([...newPreviews])
            reader.readAsDataURL(f)
        })
        setReplaceImgs(true)
    }

    const submit = async () => {
        if (!rating) return toast.error('Please select a rating')
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('rating', rating)
            fd.append('body', body)
            if (replaceImgs) {
                images.forEach((img, i) => fd.append(`image_${i}`, img))
            }
            const { data } = await editReview(review.id, fd)
            toast.success('Review updated!')
            onSaved(data)
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Edit failed')
        } finally { setLoading(false) }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: T.text, fontWeight: '800', fontSize: '20px' }}>Edit Review</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Info size={15} color={T.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ color: '#92400e', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                        <strong>You can only edit your review once.</strong> After saving, this review cannot be modified again.
                    </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: T.muted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Your Rating</p>
                    <StarPicker value={rating} onChange={setRating} />
                    {rating > 0 && (
                        <p style={{ color: T.gold, fontSize: '12px', marginTop: '6px', fontWeight: '700' }}>
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: T.muted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Your Review</p>
                    <textarea value={body} onChange={e => setBody(e.target.value)}
                        rows={4}
                        style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px', color: T.text, fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6', fontFamily: 'inherit' }} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <p style={{ color: T.muted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Photos {replaceImgs ? '(new)' : '(current)'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {previews.map((src, i) => (
                            <img key={i} src={src} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '7px', border: `1px solid ${T.border}` }} />
                        ))}
                        <button onClick={() => fileRef.current?.click()}
                            style={{ width: '64px', height: '64px', background: T.bg, border: `2px dashed ${T.border}`, borderRadius: '7px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', color: T.muted }}>
                            <ImagePlus size={18} />
                            <span style={{ fontSize: '10px' }}>Replace</span>
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                            onChange={e => addImages(e.target.files)} />
                    </div>
                    {replaceImgs && <p style={{ color: T.muted, fontSize: '12px' }}>New photos will replace current ones on save.</p>}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#e8e8ed', color: T.subtext, border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                    <button onClick={submit} disabled={loading}
                        style={{ flex: 2, background: T.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: '800' }}>
                        {loading ? 'Saving...' : 'Save Edit'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Review Card ───────────────────────────────────────────
function ReviewCard({ review, isOwn, canEdit, onEditSaved }) {
    const [showEdit, setShowEdit] = useState(false)

    return (
        <>
            <div style={{ background: isOwn ? 'rgba(0,102,204,0.04)' : T.card, border: isOwn ? `1px solid rgba(0,102,204,0.2)` : `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: T.cardShadow }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <p style={{ color: T.text, fontWeight: '700', fontSize: '14px' }}>{review.user_name}</p>
                            {isOwn && <span style={{ background: 'rgba(0,102,204,0.1)', color: T.accent, fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '4px' }}>YOU</span>}
                            {review.is_edited && <span style={{ color: T.muted, fontSize: '11px' }}>(edited)</span>}
                        </div>
                        <p style={{ color: T.muted, fontSize: '11px' }}>
                            {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            {review.edited_at && ` · edited ${new Date(review.edited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StarDisplay value={review.rating} size={13} />
                        {isOwn && canEdit && (
                            <button onClick={() => setShowEdit(true)}
                                title="Edit review (once only)"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: T.gold, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}>
                                <Pencil size={11} /> Edit
                            </button>
                        )}
                        {isOwn && !canEdit && (
                            <span title="You have already edited this review" style={{ background: '#f5f5f7', border: `1px solid ${T.border}`, borderRadius: '6px', padding: '4px 8px', color: T.muted, fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Pencil size={11} /> Edited
                            </span>
                        )}
                    </div>
                </div>

                {review.body && <p style={{ color: T.subtext, fontSize: '14px', lineHeight: '1.6', marginBottom: review.image_urls?.length ? '10px' : 0 }}>{review.body}</p>}

                {review.image_urls?.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {review.image_urls.map((url, i) => (
                            <img key={i} src={url} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '7px', border: `1px solid ${T.border}`, cursor: 'pointer' }}
                                onClick={() => window.open(url, '_blank')} />
                        ))}
                    </div>
                )}

                {review.reply && (
                    <div style={{ background: 'rgba(0,102,204,0.04)', border: `1px solid rgba(0,102,204,0.18)`, borderRadius: '8px', padding: '12px', marginTop: '10px', borderLeft: `3px solid ${T.accent}` }}>
                        <p style={{ color: T.accent, fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>⚡ {review.reply.admin_name} · Admin</p>
                        <p style={{ color: T.subtext, fontSize: '14px', lineHeight: '1.6' }}>{review.reply.body}</p>
                    </div>
                )}
            </div>

            {showEdit && (
                <EditReviewModal review={review} onClose={() => setShowEdit(false)} onSaved={onEditSaved} />
            )}
        </>
    )
}

// ── Update Card ───────────────────────────────────────────
function UpdateCard({ update, user }) {
    const [expanded, setExpanded] = useState(false)
    const [comment, setComment] = useState('')
    const [posting, setPosting] = useState(false)
    const [localUpdate, setLocalUpdate] = useState(update)

    const submitComment = async () => {
        if (!comment.trim()) return
        setPosting(true)
        try {
            const { data } = await commentOnUpdate(update.id, comment)
            setLocalUpdate(data); setComment('')
        } catch { toast.error('Failed to post comment') }
        finally { setPosting(false) }
    }

    return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: T.cardShadow }}>
            <span style={{ background: 'rgba(0,102,204,0.08)', color: T.accent, fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>
                ⚡ {localUpdate.admin_name}
            </span>
            <h4 style={{ color: T.text, fontWeight: '700', fontSize: '15px', margin: '6px 0 4px' }}>{localUpdate.title}</h4>
            <p style={{ color: T.muted, fontSize: '12px', marginBottom: '10px' }}>{new Date(localUpdate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p style={{ color: T.subtext, fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>{localUpdate.body}</p>
            <button onClick={() => setExpanded(e => !e)}
                style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={13} />
                {localUpdate.comments.length} comment{localUpdate.comments.length !== 1 ? 's' : ''}
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {expanded && (
                <div style={{ marginTop: '12px', borderTop: `1px solid ${T.border}`, paddingTop: '12px' }}>
                    {localUpdate.comments.map((c, idx) => (
                        <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: T.bg, borderRadius: '8px', border: `1px solid ${T.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <p style={{ color: T.text, fontSize: '13px', fontWeight: '600' }}>{c.user_name}</p>
                                <p style={{ color: T.muted, fontSize: '11px' }}>{new Date(c.created_at).toLocaleDateString()}</p>
                            </div>
                            <p style={{ color: T.subtext, fontSize: '13px', lineHeight: '1.5' }}>{c.body}</p>
                        </div>
                    ))}
                    {user ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input value={comment} onChange={e => setComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitComment()}
                                placeholder="Write a comment..."
                                style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px', color: T.text, fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                            <button onClick={submitComment} disabled={posting}
                                style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                                <Send size={14} />
                            </button>
                        </div>
                    ) : <p style={{ color: T.muted, fontSize: '12px', marginTop: '8px' }}>Log in to comment</p>}
                </div>
            )}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────
export default function ProductDetail() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [qty, setQty] = useState(1)
    const [reviewData, setReviewData] = useState(null)
    const [updates, setUpdates] = useState([])
    const [section, setSection] = useState('reviews')
    const [showAuthModal, setShowAuthModal] = useState(false)
    const { addToCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        getProduct(id).then(r => setProduct(r.data)).catch(() => navigate('/'))
        getProductReviews(id).then(r => setReviewData(r.data)).catch(() => { })
        getProductUpdates(id).then(r => setUpdates(r.data)).catch(() => { })
    }, [id])

    const handleAddToCart = () => {
        if (!user) { setShowAuthModal(true); return }
        addToCart(product, qty)
        toast.success('Added to cart!')
    }

    const handleEditSaved = (updatedReview) => {
        setReviewData(prev => ({
            ...prev,
            reviews: prev.reviews.map(r => r.id === updatedReview.id ? updatedReview : r),
        }))
    }

    if (!product) return (
        <div style={{ textAlign: 'center', padding: '6rem', color: T.muted }}>
            <div style={{ width: '36px', height: '36px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    const sortedReviews = reviewData ? [
        ...reviewData.reviews.filter(r => r.user_id === user?.id),
        ...reviewData.reviews.filter(r => r.user_id !== user?.id),
    ] : []

    return (
        <div style={{ backgroundColor: T.bg, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', paddingBottom: '80px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 2rem' }}>

                {/* Breadcrumb */}
                <p style={{ color: T.muted, fontSize: '13px', marginBottom: '24px' }}>
                    <span onClick={() => navigate('/')} style={{ color: T.accent, cursor: 'pointer', textTransform: 'capitalize' }}>Store</span>
                    {' › '}
                    <span style={{ textTransform: 'capitalize' }}>{product.category}</span>
                    {' › '}
                    <span style={{ color: T.text }}>{product.name}</span>
                </p>

                {/* Product section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'start' }}>

                    {/* Image */}
                    <div style={{ background: T.card, borderRadius: '18px', padding: '2rem', boxShadow: T.cardShadow, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src={product.image_url || 'https://via.placeholder.com/480x360?text=No+Image'}
                            alt={product.name}
                            style={{ width: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '8px' }}
                        />
                    </div>

                    {/* Info */}
                    <div>
                        <p style={{ color: T.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '6px' }}>{product.category}</p>
                        <h1 style={{ color: T.text, fontSize: '32px', fontWeight: '800', margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{product.name}</h1>

                        {reviewData && reviewData.total > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <StarDisplay value={reviewData.average} size={14} />
                                <span style={{ color: T.gold, fontWeight: '700', fontSize: '14px' }}>{reviewData.average.toFixed(1)}</span>
                                <span style={{ color: T.muted, fontSize: '13px' }}>({reviewData.total} reviews)</span>
                            </div>
                        )}

                        <p style={{ color: T.text, fontSize: '36px', fontWeight: '800', margin: '16px 0', letterSpacing: '-0.02em' }}>
                            ₱{parseFloat(product.price).toLocaleString()}
                        </p>

                        <p style={{ color: T.subtext, lineHeight: '1.7', marginBottom: '20px', fontSize: '15px' }}>{product.description}</p>

                        <p style={{ color: product.stock > 0 ? T.green : T.red, marginBottom: '20px', fontWeight: '700', fontSize: '14px' }}>
                            {product.stock > 0 ? `✓ ${product.stock} in stock` : '✗ Out of stock'}
                        </p>

                        {product.stock > 0 && (
                            <>
                                {user && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <label style={{ color: T.muted, fontSize: '13px', fontWeight: '700' }}>QTY</label>
                                        <div style={{ display: 'flex', alignItems: 'center', background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', color: T.subtext, padding: '8px 16px', cursor: 'pointer', fontSize: '18px', fontWeight: '400' }}>−</button>
                                            <span style={{ color: T.text, fontWeight: '700', padding: '0 8px', minWidth: '32px', textAlign: 'center', fontSize: '15px' }}>{qty}</span>
                                            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ background: 'none', border: 'none', color: T.subtext, padding: '8px 16px', cursor: 'pointer', fontSize: '18px', fontWeight: '400' }}>+</button>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={handleAddToCart}
                                    style={{
                                        width: '100%',
                                        background: T.accent,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        letterSpacing: '-0.01em',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = T.accentHover}
                                    onMouseLeave={e => e.currentTarget.style.background = T.accent}
                                >
                                    {user ? 'Add to Cart' : '🛒 Add to Cart — Sign In Required'}
                                </button>
                                {!user && (
                                    <p style={{ color: T.muted, fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                                        You need an account to purchase.{' '}
                                        <span onClick={() => setShowAuthModal(true)} style={{ color: T.accent, cursor: 'pointer', textDecoration: 'underline' }}>Sign in or register</span>
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Section tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: '24px' }}>
                    {[
                        { key: 'reviews', label: `Reviews${reviewData ? ` (${reviewData.total})` : ''}` },
                        { key: 'updates', label: `Updates${updates.length ? ` (${updates.length})` : ''}` },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setSection(tab.key)}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderBottom: section === tab.key ? `2px solid ${T.accent}` : '2px solid transparent',
                                color: section === tab.key ? T.text : T.muted,
                                padding: '12px 20px',
                                cursor: 'pointer',
                                fontWeight: section === tab.key ? '700' : '500',
                                fontSize: '14px',
                                marginBottom: '-1px',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {section === 'reviews' && (
                    <div>
                        {reviewData && reviewData.total > 0 ? (
                            <>
                                <RatingStats {...reviewData} />
                                {sortedReviews.map(r => (
                                    <ReviewCard key={r.id} review={r}
                                        isOwn={r.user_id === user?.id}
                                        canEdit={r.user_id === user?.id && !r.is_edited}
                                        onEditSaved={handleEditSaved}
                                    />
                                ))}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: T.muted }}>
                                <p style={{ fontSize: '36px', marginBottom: '12px' }}>⭐</p>
                                <p style={{ color: T.text, fontWeight: '600', marginBottom: '4px' }}>No reviews yet</p>
                                <p style={{ fontSize: '14px' }}>Be the first to review after purchase</p>
                            </div>
                        )}
                    </div>
                )}

                {section === 'updates' && (
                    <div>
                        {updates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: T.muted }}>
                                <p style={{ fontSize: '36px', marginBottom: '12px' }}>📢</p>
                                <p style={{ color: T.text, fontWeight: '600', marginBottom: '4px' }}>No updates yet</p>
                                <p style={{ fontSize: '14px' }}>Check back for product news</p>
                            </div>
                        ) : (
                            updates.map(u => <UpdateCard key={u.id} update={u} user={user} />)
                        )}
                    </div>
                )}

                {showAuthModal && <AuthPromptModal onClose={() => setShowAuthModal(false)} />}
            </div>
        </div>
    )
}
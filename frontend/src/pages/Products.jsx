import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getProducts } from '../services/api'
import { getCached, setCached } from '../services/productCache'
import ProductGridCard from '../components/ProductGridCard'
import AuthPromptModal from '../components/modals/AuthPromptModal'
import { useAuth } from '../context/AuthContext'
import { AnimatePresence, motion } from 'motion/react'

import accessoriesCardBg from '../assets/accessories-card.png'
import musicCardBg from '../assets/music-card2.png'

const CATEGORIES = ['All', 'phones', 'laptops', 'tablets', 'accessories', 'audio', 'cameras', 'gaming']
const PAGE_SIZE = 20

// ─── Carousel Context ────────────────────────────────────────────────────────
const CarouselContext = createContext({ onCardClose: () => { }, currentIndex: 0 })

// ─── Carousel Wrapper ────────────────────────────────────────────────────────
function ProductCarousel({ items }) {
    const carouselRef = useRef(null)
    const [currentIndex, setCurrentIndex] = useState(0)

    const scrollLeft = () => carouselRef.current?.scrollBy({ left: -420, behavior: 'smooth' })
    const scrollRight = () => carouselRef.current?.scrollBy({ left: 420, behavior: 'smooth' })

    const handleCardClose = (index) => {
        if (carouselRef.current) {
            const cardWidth = window.innerWidth < 768 ? 260 : 412
            carouselRef.current.scrollTo({ left: (cardWidth + 12) * index, behavior: 'smooth' })
            setCurrentIndex(index)
        }
    }

    return (
        <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
            <div style={{ position: 'relative', width: '100%' }}>
                <div
                    ref={carouselRef}
                    style={{
                        display: 'flex',
                        overflowX: 'auto',
                        overflowY: 'visible',
                        scrollbarWidth: 'none',
                        gap: '12px',
                        paddingBottom: '12px',
                        paddingLeft: '4px',
                        paddingRight: '4px',
                        scrollBehavior: 'smooth',
                    }}
                >
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.03 * index, ease: 'easeOut' } }}
                            style={{ flexShrink: 0 }}
                        >
                            {item}
                        </motion.div>
                    ))}
                    <div style={{ flexShrink: 0, width: '20px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                        onClick={scrollLeft}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#e5e5ea', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d1d1d6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e5e5ea'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                        onClick={scrollRight}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#e5e5ea', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d1d1d6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#e5e5ea'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            </div>
        </CarouselContext.Provider>
    )
}

// ─── Apple-style Product Card ────────────────────────────────────────────────
function AppleProductCard({ product, index }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { onCardClose } = useContext(CarouselContext)
    const [open, setOpen] = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)
    const overlayRef = useRef(null)

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') handleClose() }
        document.body.style.overflow = open ? 'hidden' : 'auto'
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open])

    const handleOpen = () => setOpen(true)
    const handleClose = () => { setOpen(false); onCardClose(index) }

    const handleBuy = (e) => {
        e.stopPropagation()
        if (user?.role === 'admin') return
        navigate(`/products/${product.id}`)
    }

    const handleCardClick = () => {
        if (user?.role === 'admin') navigate(`/admin/products/${product.id}`)
        else handleOpen()
    }

    const isOutOfStock = product.stock === 0
    const imageUrl = product.image_url || 'https://via.placeholder.com/400x500?text=No+Image'

    return (
        <>
            {/* ── Expanded overlay modal ── */}
            <AnimatePresence>
                {open && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
                        />
                        <motion.div
                            ref={overlayRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{
                                position: 'relative', zIndex: 10000,
                                margin: '40px auto', maxWidth: '560px', width: 'calc(100% - 40px)',
                                background: '#fff', borderRadius: '24px',
                                overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                            }}
                        >
                            <button
                                onClick={handleClose}
                                style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>

                            {/* Modal hero — fixed aspect ratio to prevent layout shift */}
                            <div style={{ background: '#f5f5f7', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img
                                    src={imageUrl}
                                    alt={product.name}
                                    loading="lazy"
                                    decoding="async"
                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: '20px' }}
                                />
                            </div>

                            <div style={{ padding: '24px 28px 32px' }}>
                                <p style={{ fontSize: '13px', color: '#6e6e73', fontWeight: '500', marginBottom: '6px', textTransform: 'capitalize' }}>{product.category}</p>
                                <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111', marginBottom: '8px', lineHeight: '1.2' }}>{product.name}</h2>
                                <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.6', marginBottom: '20px' }}>{product.description || 'No description available.'}</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                    <p style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>From ₱{parseFloat(product.price).toLocaleString()}</p>
                                    {user?.role !== 'admin' && (
                                        <button
                                            onClick={() => { handleClose(); navigate(`/products/${product.id}`) }}
                                            style={{ padding: '12px 28px', borderRadius: '980px', background: '#0066cc', color: '#fff', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.target.style.background = '#0077ed'}
                                            onMouseLeave={e => e.target.style.background = '#0066cc'}
                                        >
                                            Learn More
                                        </button>
                                    )}
                                </div>
                                {!isOutOfStock && <p style={{ fontSize: '12px', color: '#6e6e73', marginTop: '12px' }}>{product.stock} in stock</p>}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Portrait Card — aspect-ratio based, no hardcoded height ── */}
            <motion.div
                onClick={handleCardClick}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                style={{
                    width: 'clamp(260px, 30vw, 412px)',
                    aspectRatio: '4/5',          // ← replaces hardcoded height, reserves space before image loads
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    background: '#1d1d1f',        // ← visible placeholder colour while image loads
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                {/* Dark gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 45%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />

                {/* Product image — lazy loaded, blur-up effect */}
                <img
                    src={imageUrl}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImgLoaded(true)}
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', zIndex: 1,
                        filter: imgLoaded ? 'none' : 'blur(8px)',
                        transition: 'filter 0.4s ease',
                    }}
                />

                {isOutOfStock && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '980px', letterSpacing: '0.02em' }}>
                        Sold Out
                    </div>
                )}

                <div style={{ position: 'relative', zIndex: 3, padding: '20px 20px 0' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize', letterSpacing: '0.04em', margin: 0 }}>{product.category}</p>
                </div>

                <div style={{ position: 'relative', zIndex: 3, padding: '0 20px 22px' }}>
                    <h4 style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: '700', color: '#fff', margin: '0 0 4px', lineHeight: '1.25', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                    </h4>
                    <p style={{ fontSize: 'clamp(13px, 1.4vw, 16px)', fontWeight: '600', color: 'rgba(255,255,255,0.85)', margin: '0 0 14px' }}>
                        From ₱{parseFloat(product.price).toLocaleString()}
                    </p>
                    {user?.role !== 'admin' && (
                        <button
                            onClick={handleBuy}
                            disabled={isOutOfStock}
                            style={{ background: isOutOfStock ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.92)', color: isOutOfStock ? 'rgba(255,255,255,0.5)' : '#0066cc', border: 'none', borderRadius: '980px', fontSize: 'clamp(12px, 1.2vw, 15px)', fontWeight: '600', padding: 'clamp(6px,0.6vw,9px) clamp(14px,1.5vw,20px)', cursor: isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (!isOutOfStock) e.target.style.background = '#fff' }}
                            onMouseLeave={e => { if (!isOutOfStock) e.target.style.background = 'rgba(255,255,255,0.92)' }}
                        >
                            {isOutOfStock ? 'Sold Out' : 'Buy ›'}
                        </button>
                    )}
                </div>
            </motion.div>
        </>
    )
}

// ─── Banner Card ─────────────────────────────────────────────────────────────
function BannerCard({ title, subtitle, imageSrc }) {
    return (
        <div style={{ width: 'clamp(260px, 30vw, 412px)', aspectRatio: '4/5', background: '#1d1d1f', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 20px 0' }}>
            <div>
                <h3 style={{ fontSize: 'clamp(14px, 1.8vw, 22px)', fontWeight: '700', color: '#fff', marginBottom: '6px', lineHeight: '1.2' }}>{title}</h3>
                <p style={{ fontSize: 'clamp(11px, 1.2vw, 15px)', color: '#ababab', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{subtitle}</p>
            </div>
            <img src={imageSrc} alt={title} loading="lazy" decoding="async" style={{ width: '100%', flex: 1, objectFit: 'cover', marginTop: '16px' }} />
        </div>
    )
}

// ─── Section with header + carousel ──────────────────────────────────────────
function CarouselSection({ title, subtitle, linkLabel, onLinkClick, items, showViewAll = true }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'clamp(16px, 3.5vw, 21px)', margin: 0, fontWeight: '700', color: '#111' }}>
                    {title} <span style={{ color: '#6e6e73', fontWeight: '600', fontSize: 'clamp(12px, 2.5vw, 16px)' }}>{subtitle}</span>
                </h2>
                {showViewAll && (
                    <button onClick={onLinkClick} style={{ background: 'none', border: 'none', color: '#1d1d1f', fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: '500', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                        {linkLabel}
                    </button>
                )}
            </div>
            <ProductCarousel items={items} />
        </div>
    )
}

// ─── Category Menu ────────────────────────────────────────────────────────────
function CategoryMenuWithArrows({ categories, selectedCategory, onSelect }) {
    const scrollRef = useRef(null)
    const filteredCats = categories.filter(cat => cat !== 'All')
    const ITEM_WIDTH = `calc((100%) / 6)`

    const scrollRight = () => scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth / 6, behavior: 'smooth' })

    const catImages = {
        phones: new URL('../assets/phones.png', import.meta.url).href,
        laptops: new URL('../assets/laptops.png', import.meta.url).href,
        tablets: new URL('../assets/tablets.png', import.meta.url).href,
        accessories: new URL('../assets/accessories.png', import.meta.url).href,
        audio: new URL('../assets/audio.png', import.meta.url).href,
        cameras: new URL('../assets/camera.png', import.meta.url).href,
        gaming: new URL('../assets/gaming.png', import.meta.url).href,
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: 'clamp(1.5rem, 4vw, 2rem) 0', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <style>{`.cat-scroll::-webkit-scrollbar { display: none; }`}</style>
                <div ref={scrollRef} className="cat-scroll" style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {filteredCats.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onSelect(cat)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedCategory === cat || selectedCategory === 'All' ? 1 : 0.55, transition: 'opacity 0.2s, transform 0.2s', background: 'none', border: 'none', padding: '4px 0', width: ITEM_WIDTH, minWidth: ITEM_WIDTH, flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = selectedCategory === cat ? '1' : '0.55'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            <img src={catImages[cat] || ''} alt={cat} loading="lazy" decoding="async" style={{ width: 'clamp(64px, 9vw, 88px)', height: 'clamp(64px, 9vw, 88px)', objectFit: 'contain' }} />
                            <span style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', fontWeight: selectedCategory === cat ? '700' : '500', color: selectedCategory === cat ? '#111' : '#444', textTransform: 'capitalize', textAlign: 'center', lineHeight: 1.2, transition: 'color 0.2s, font-weight 0.2s', whiteSpace: 'nowrap' }}>
                                {cat}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={scrollRight}
                style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: '#e8e8ed', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '12px', transition: 'background 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#d1d1d6'; e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e8e8ed'; e.currentTarget.style.transform = 'scale(1)' }}
                aria-label="Scroll categories right"
            >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
        </div>
    )
}

// ─── Load More Button ─────────────────────────────────────────────────────────
function LoadMoreButton({ onClick, loading }) {
    return (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
                onClick={onClick}
                disabled={loading}
                style={{ background: '#0066cc', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 32px', fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.15s, opacity 0.15s' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0077ed' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0066cc' }}
            >
                {loading ? 'Loading...' : 'Load More'}
            </button>
        </div>
    )
}

// ─── Main Products Page ───────────────────────────────────────────────────────
export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)

    const category = searchParams.get('category') || 'All'
    const searchQuery = searchParams.get('search') || ''

    // Reset when filters change
    useEffect(() => {
        setPage(1)
        setProducts([])
        setHasMore(false)
    }, [category, searchQuery])

    // Fetch products
    useEffect(() => {
        const params = { page_size: PAGE_SIZE, page }
        if (category !== 'All') params.category = category
        if (searchQuery) params.search = searchQuery

        // Serve from cache on page 1 only
        if (page === 1) {
            const cached = getCached(params)
            if (cached) {
                setProducts(cached.results ?? cached)
                setHasMore(!!cached.next)
                setLoading(false)
                return
            }
            setLoading(true)
        } else {
            setLoadingMore(true)
        }

        getProducts(params)
            .then(r => {
                const data = r.data
                const results = data.results ?? data
                if (page === 1) {
                    setCached(params, data)
                    setProducts(results)
                } else {
                    setProducts(prev => [...prev, ...results])
                }
                setHasMore(!!data.next)
            })
            .finally(() => {
                setLoading(false)
                setLoadingMore(false)
            })
    }, [category, searchQuery, page])

    const handleCategorySelect = (cat) => setSearchParams({ category: cat })

    // Derived slices — computed from already-fetched products
    const latestProducts = [...products].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 7)
    const latestAccessories = products.filter(p => (p.category || '').toLowerCase() === 'accessories').slice(0, 8)
    const latestAudio = products.filter(p => (p.category || '').toLowerCase() === 'audio').slice(0, 8)

    return (
        <div style={{ backgroundColor: '#f5f5f7', minHeight: '100vh', paddingBottom: 'clamp(40px, 8vw, 80px)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 2rem)' }}>

                {/* Header */}
                {searchQuery ? (
                    <div style={{ paddingTop: 'clamp(28px, 6vw, 60px)', paddingBottom: '20px' }}>
                        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: '700', margin: '0 0 8px', color: '#111', letterSpacing: '-0.02em' }}>
                            Results for "{searchQuery}"
                        </h1>
                        <p style={{ color: '#6e6e73', fontSize: '15px', margin: 0 }}>
                            {products.length} product{products.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                ) : category === 'All' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(28px, 6vw, 60px) 0 clamp(20px, 4vw, 40px)', flexWrap: 'wrap', gap: '16px' }}>
                        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: '700', margin: 0, color: '#111', letterSpacing: '-0.02em' }}>Store</h1>
                        <h2 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.75rem)', fontWeight: '600', color: '#111', margin: 0, lineHeight: '1.2', maxWidth: '360px', letterSpacing: '-0.01em' }}>
                            The best way to buy the<br />products you love.
                        </h2>
                    </div>
                ) : (
                    <div style={{ paddingTop: 'clamp(28px, 6vw, 60px)', paddingBottom: '20px' }}>
                        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: '700', margin: 0, color: '#111', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                            {category}
                        </h1>
                    </div>
                )}

                <CategoryMenuWithArrows categories={CATEGORIES} selectedCategory={category} onSelect={handleCategorySelect} />

                {/* Full-page loading spinner — only on first page load */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '6rem' }}>
                        <div style={{ width: '40px', height: '40px', border: '4px solid #d2d2d7', borderTop: '4px solid #0066cc', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                ) : (
                    <>
                        {/* ── Search results ── */}
                        {searchQuery ? (
                            <div style={{ marginTop: '24px' }}>
                                {products.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem', color: '#6e6e73' }}>
                                        <p style={{ fontSize: '42px', marginBottom: '12px' }}>🔍</p>
                                        <p style={{ color: '#111', fontWeight: '600', fontSize: '18px', marginBottom: '6px' }}>No results for "{searchQuery}"</p>
                                        <p style={{ fontSize: '14px' }}>Try a different search term or browse by category.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 40vw, 220px), 1fr))', gap: 'clamp(8px, 2vw, 12px)' }}>
                                            {products.map(p => (
                                                <div key={p.id} style={{ height: '280px' }}>
                                                    <ProductGridCard product={p} />
                                                </div>
                                            ))}
                                        </div>
                                        {hasMore && <LoadMoreButton onClick={() => setPage(p => p + 1)} loading={loadingMore} />}
                                    </>
                                )}
                            </div>

                            /* ── Home / "All" carousels ── */
                        ) : category === 'All' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                <CarouselSection
                                    title="The latest."
                                    subtitle="Take a look at what's new!"
                                    linkLabel="View All"
                                    onLinkClick={() => handleCategorySelect('All')}
                                    showViewAll={false}
                                    items={latestProducts.map((p, i) => <AppleProductCard key={p.id} product={p} index={i} />)}
                                />

                                {latestAccessories.length > 0 && (
                                    <CarouselSection
                                        title="Accessories."
                                        subtitle="Essentials that pair perfectly with your favorite devices."
                                        linkLabel="View All"
                                        onLinkClick={() => handleCategorySelect('accessories')}
                                        items={[
                                            <BannerCard key="banner-acc" title="Here and wow." subtitle={"The accessories you love.\nIn a fresh mix of colours."} imageSrc={accessoriesCardBg} />,
                                            ...latestAccessories.map((p, i) => <AppleProductCard key={p.id} product={p} index={i + 1} />)
                                        ]}
                                    />
                                )}

                                {latestAudio.length > 0 && (
                                    <CarouselSection
                                        title="Loud and clear."
                                        subtitle="Unparalleled choices for rich, high-quality sound."
                                        linkLabel="View All"
                                        onLinkClick={() => handleCategorySelect('audio')}
                                        items={[
                                            <BannerCard key="banner-audio" title="Silence, redefined." subtitle={"Immerse yourself in the\nmusic you love."} imageSrc={musicCardBg} />,
                                            ...latestAudio.map((p, i) => <AppleProductCard key={p.id} product={p} index={i + 1} />)
                                        ]}
                                    />
                                )}
                            </div>

                            /* ── Category grid ── */
                        ) : (
                            <div style={{ marginTop: '40px' }}>
                                <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: '700', marginBottom: 'clamp(1rem, 3vw, 2rem)', color: '#111' }}>Explore the lineup.</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 40vw, 220px), 1fr))', gap: 'clamp(8px, 2vw, 12px)' }}>
                                    {products.map(p => (
                                        <div key={p.id} style={{ height: '280px' }}>
                                            <ProductGridCard product={p} />
                                        </div>
                                    ))}
                                </div>
                                {hasMore && <LoadMoreButton onClick={() => setPage(p => p + 1)} loading={loadingMore} />}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
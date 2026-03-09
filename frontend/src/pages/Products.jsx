import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../services/api'
import CategoryMenu from '../components/CategoryMenu'
import ProductGridCard from '../components/ProductGridCard'

import accessoriesCardBg from '../assets/accessories-card.jpg'
import musicCardBg from '../assets/music-card.jpg'

const CATEGORIES = ['All', 'phones', 'laptops', 'tablets', 'accessories', 'audio', 'cameras', 'gaming']

// Banner card for the first slot in each section
function BannerCard({ title, subtitle, imageSrc }) {
    return (
        <div style={{
            background: '#1d1d1f',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 20px 0 20px',
            height: '100%',
            position: 'relative',
        }}>
            <div style={{ textAlign: 'left', zIndex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#fff', lineHeight: '1.2' }}>
                    {title}
                </h3>
                <p style={{ fontSize: '12px', color: '#ababab', lineHeight: '1.4' }}>
                    {subtitle}
                </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginTop: '12px' }}>
                <img
                    src={imageSrc}
                    alt={title}
                    style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }}
                />
            </div>
        </div>
    )
}

export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const category = searchParams.get('category') || 'All'

    useEffect(() => {
        const params = {}
        if (category !== 'All') params.category = category
        setLoading(true)
        getProducts(params)
            .then(r => setProducts(r.data.results || r.data))
            .finally(() => setLoading(false))
    }, [category])

    const handleCategorySelect = (cat) => {
        setSearchParams({ category: cat })
    }

    // Latest 7 overall
    const latestProducts = [...products]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 7)

    // Latest 5 accessories (to fill remaining 5 of 6 slots after banner)
    const latestAccessories = [...products]
        .filter(p => (p.category || '').toLowerCase() === 'accessories')
        .slice(0, 5)

    // Latest 5 audio
    const latestAudio = [...products]
        .filter(p => (p.category || '').toLowerCase() === 'audio')
        .slice(0, 5)

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
    }

    const cardHeight = '280px'

    return (
        <div style={{
            backgroundColor: '#f5f5f7',
            minHeight: '100vh',
            paddingBottom: '80px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}>
            <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 2rem' }}>

                {/* Header Section */}
                {category === 'All' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '60px 0 40px', flexWrap: 'wrap', gap: '20px' }}>
                        <h1 style={{ fontSize: '56px', fontWeight: '700', margin: 0, color: '#111', letterSpacing: '-0.02em' }}>Store</h1>
                        <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#111', margin: 0, textAlign: 'right', lineHeight: '1.2', maxWidth: '360px', letterSpacing: '-0.01em' }}>
                            The best way to buy the<br />products you love.
                        </h2>
                    </div>
                ) : (
                    <div style={{ paddingTop: '60px', paddingBottom: '20px' }}>
                        <h1 style={{ fontSize: '56px', fontWeight: '700', margin: 0, color: '#111', letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                            {category}
                        </h1>
                    </div>
                )}

                {/* Category Menu */}
                <CategoryMenu categories={CATEGORIES} selectedCategory={category} onSelect={handleCategorySelect} />

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '6rem' }}>
                        <div style={{ width: '40px', height: '40px', border: '4px solid #d2d2d7', borderTop: '4px solid #0066cc', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                ) : (
                    <>
                        {category === 'All' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                {/* The Latest */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                                        <h2 style={{ fontSize: '21px', margin: 0, fontWeight: '700', color: '#111' }}>
                                            The latest. <span style={{ color: '#6e6e73', fontWeight: '600' }}>Take a look what's new!</span>
                                        </h2>
                                        <Link
                                            to="/?category=all"
                                            onClick={() => handleCategorySelect('All')}
                                            style={{ color: '#1d1d1f', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
                                        >
                                            View All
                                        </Link>
                                    </div>
                                    <div style={gridStyle}>
                                        {latestProducts.map(p => (
                                            <div key={p.id} style={{ height: cardHeight }}>
                                                <ProductGridCard product={p} />
                                            </div>
                                        ))}
                                        {/* Fill empty slots */}
                                        {Array.from({ length: Math.max(0, 4 - (latestProducts.length % 4 || 4)) }).map((_, i) => (
                                            <div key={`empty-l-${i}`} style={{ height: cardHeight, background: '#fff', borderRadius: '16px', opacity: 0.4 }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Accessories */}
                                {latestAccessories.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                                            <h2 style={{ fontSize: '21px', margin: 0, fontWeight: '700', color: '#111' }}>
                                                Accessories. <span style={{ color: '#6e6e73', fontWeight: '600' }}>Essentials that pair perfectly with your favorite devices.</span>
                                            </h2>
                                            <Link
                                                to="/?category=accessories"
                                                onClick={() => handleCategorySelect('accessories')}
                                                style={{ color: '#1d1d1f', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
                                            >
                                                View All
                                            </Link>
                                        </div>
                                        <div style={gridStyle}>
                                            <div style={{ height: cardHeight }}>
                                                <BannerCard
                                                    title="Here and wow."
                                                    subtitle={"The accessories you love.\nIn a fresh mix of colours."}
                                                    imageSrc={accessoriesCardBg}
                                                />
                                            </div>
                                            {latestAccessories.map(p => (
                                                <div key={p.id} style={{ height: cardHeight }}>
                                                    <ProductGridCard product={p} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Audio */}
                                {latestAudio.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                                            <h2 style={{ fontSize: '21px', margin: 0, fontWeight: '700', color: '#111' }}>
                                                Loud and clear. <span style={{ color: '#6e6e73', fontWeight: '600' }}>Unparalleled choices for rich, high-quality sound.</span>
                                            </h2>
                                            <Link
                                                to="/?category=audio"
                                                onClick={() => handleCategorySelect('audio')}
                                                style={{ color: '#1d1d1f', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
                                            >
                                                View All
                                            </Link>
                                        </div>
                                        <div style={gridStyle}>
                                            <div style={{ height: cardHeight }}>
                                                <BannerCard
                                                    title="Silence, redefined."
                                                    subtitle={"Immerse yourself in the\nmusic you love."}
                                                    imageSrc={musicCardBg}
                                                />
                                            </div>
                                            {latestAudio.map(p => (
                                                <div key={p.id} style={{ height: cardHeight }}>
                                                    <ProductGridCard product={p} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div style={{ marginTop: '40px' }}>
                                <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '32px', color: '#111' }}>Explore the lineup.</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                    {products.map(p => (
                                        <div key={p.id} style={{ height: cardHeight }}>
                                            <ProductGridCard product={p} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

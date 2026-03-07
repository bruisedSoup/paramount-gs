import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProducts } from '../services/api'
import toast from 'react-hot-toast'
import { ShoppingCart, Search } from 'lucide-react'

const CATEGORIES = ['All', 'phones', 'laptops', 'tablets', 'accessories', 'audio', 'cameras', 'gaming']

export default function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const { addToCart } = useCart()

    useEffect(() => {
        const params = {}
        if (search) params.search = search
        if (category !== 'All') params.category = category
        getProducts(params)
            .then(r => setProducts(r.data.results || r.data))
            .finally(() => setLoading(false))
    }, [search, category])

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search products..."
                        style={{ width: '100%', background: '#111118', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '10px 14px 10px 38px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                            style={{ background: category === cat ? '#00e5ff' : '#111118', color: category === cat ? '#000' : '#94a3b8', border: '1px solid #1e1e2e', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <p style={{ color: '#64748b', textAlign: 'center', padding: '4rem' }}>Loading...</p> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {products.map(p => (
                        <div key={p.id} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s' }}>
                            <Link to={`/products/${p.id}`}>
                                <img src={p.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                                    alt={p.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            </Link>
                            <div style={{ padding: '16px' }}>
                                <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{p.category}</p>
                                <Link to={`/products/${p.id}`} style={{ color: '#fff', fontWeight: '700', textDecoration: 'none', fontSize: '16px', display: 'block', marginBottom: '8px' }}>{p.name}</Link>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#00e5ff', fontWeight: '800', fontSize: '18px' }}>₱{parseFloat(p.price).toLocaleString()}</span>
                                    <button onClick={() => { addToCart(p); toast.success('Added to cart') }}
                                        disabled={p.stock === 0}
                                        style={{ background: p.stock > 0 ? '#00e5ff' : '#1e1e2e', color: p.stock > 0 ? '#000' : '#64748b', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: p.stock > 0 ? 'pointer' : 'not-allowed' }}>
                                        <ShoppingCart size={16} />
                                    </button>
                                </div>
                                <p style={{ color: p.stock > 0 ? '#10b981' : '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}
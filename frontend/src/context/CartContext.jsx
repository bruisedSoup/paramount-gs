import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [cart, setCart] = useState([])

    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            const ex = prev.find(i => i.product.id === product.id)
            if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
            return [...prev, { product, quantity }]
        })
    }

    const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product.id !== productId))

    const updateQty = (productId, quantity) => {
        if (quantity < 1) { removeFromCart(productId); return }
        setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i))
    }

    const clearCart = () => setCart([])
    const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
    const count = cart.reduce((s, i) => s + i.quantity, 0)

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, count }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
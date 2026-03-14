import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const SavesContext = createContext(null)

export function SavesProvider({ children }) {
    const { user } = useAuth()
    const [saves, setSaves] = useState([])

    // Load saves from localStorage keyed by user id
    useEffect(() => {
        if (user && user.role !== 'admin') {
            const stored = localStorage.getItem(`saves_${user.id}`)
            setSaves(stored ? JSON.parse(stored) : [])
        } else {
            setSaves([])
        }
    }, [user])

    const persistSaves = (newSaves) => {
        if (user) {
            localStorage.setItem(`saves_${user.id}`, JSON.stringify(newSaves))
        }
    }

    const saveProduct = (product) => {
        setSaves(prev => {
            const already = prev.find(p => p.id === product.id)
            if (already) return prev
            const updated = [...prev, product]
            persistSaves(updated)
            return updated
        })
    }

    const unsaveProduct = (productId) => {
        setSaves(prev => {
            const updated = prev.filter(p => p.id !== productId)
            persistSaves(updated)
            return updated
        })
    }

    const isSaved = (productId) => saves.some(p => p.id === productId)

    return (
        <SavesContext.Provider value={{ saves, saveProduct, unsaveProduct, isSaved }}>
            {children}
        </SavesContext.Provider>
    )
}

export const useSaves = () => useContext(SavesContext)
import React from 'react'

import phonesImg from '../assets/phones.jpg'
import laptopsImg from '../assets/laptops.png'
import tabletsImg from '../assets/tablets.jpg'
import accessoriesImg from '../assets/accessories.png'
import audioImg from '../assets/audio.png'
import camerasImg from '../assets/camera.jpg'
import gamingImg from '../assets/gaming.jpg'

export const categoryImages = {
    phones: phonesImg,
    laptops: laptopsImg,
    tablets: tabletsImg,
    accessories: accessoriesImg,
    audio: audioImg,
    cameras: camerasImg,
    gaming: gamingImg,
}

export default function CategoryMenu({ categories = [], selectedCategory, onSelect }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(1.5rem, 4vw, 3rem)',
            padding: 'clamp(1.5rem, 4vw, 2rem) 0',
            marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
            flexWrap: 'wrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
        }}>
            {categories.filter(cat => cat !== 'All').map(cat => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        opacity: selectedCategory === cat || selectedCategory === 'All' ? 1 : 0.6,
                        transition: 'opacity 0.2s',
                        background: 'none',
                        border: 'none',
                        padding: '0 clamp(8px, 2vw, 12px)',
                        minWidth: 'clamp(56px, 12vw, 80px)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = selectedCategory === cat ? '1' : '0.6'}
                >
                    <img
                        src={categoryImages[cat]}
                        alt={cat}
                        style={{
                            width: 'clamp(48px, 10vw, 64px)',
                            height: 'clamp(48px, 10vw, 64px)',
                            objectFit: 'contain',
                        }}
                    />
                    <span style={{
                        fontSize: 'clamp(11px, 2vw, 13px)',
                        fontWeight: '500',
                        color: '#333',
                        textTransform: 'capitalize',
                        textAlign: 'center',
                        lineHeight: 1.2,
                    }}>
                        {cat}
                    </span>
                </button>
            ))}
        </div>
    )
}
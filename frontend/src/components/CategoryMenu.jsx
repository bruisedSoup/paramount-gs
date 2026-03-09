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
            gap: '3rem',
            padding: '2rem 0',
            flexWrap: 'wrap',
            marginBottom: '2rem'
        }}>
            {categories.filter(cat => cat !== 'All').map(cat => (
                <div
                    key={cat}
                    onClick={() => onSelect(cat)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        opacity: selectedCategory === cat || selectedCategory === 'All' ? 1 : 0.6,
                        transition: 'opacity 0.2s',
                    }}
                >
                    <img
                        src={categoryImages[cat]}
                        alt={cat}
                        style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'contain',
                        }}
                    />
                    <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333',
                        textTransform: 'capitalize'
                    }}>
                        {cat}
                    </span>
                </div>
            ))}
        </div>
    )
}

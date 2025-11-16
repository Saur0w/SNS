"use client";

import { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { CldImage } from 'next-cloudinary';

interface ImageData {
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    uploadedAt: string;
}

export default function Landing() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        loadGallery();
    }, []);

    useEffect(() => {
        filterImages();
    }, [images, activeCategory, searchQuery]);

    const loadGallery = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gallery');
            if (response.ok) {
                const data = await response.json();
                setImages(data.images || []);
            } else {
                console.error('Failed to load gallery');
                setImages([]);
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filterImages = (): void => {
        let filtered = images;

        // Filter by category
        if (activeCategory !== 'all') {
            filtered = filtered.filter((img) => img.category === activeCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((img) =>
                img.title.toLowerCase().includes(query) ||
                img.description.toLowerCase().includes(query) ||
                img.tags.some((tag) => tag.toLowerCase().includes(query))
            );
        }

        setFilteredImages(filtered);
    };

    const openLightbox = (image: ImageData): void => {
        setSelectedImage(image);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = (): void => {
        setSelectedImage(null);
        document.body.style.overflow = 'auto';
    };

    const getCategories = (): string[] => {
        const categories = images.map((img) => img.category);
        return ['all', ...Array.from(new Set(categories))];
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Escape' && selectedImage) {
            closeLightbox();
        }
    };

    return (
        <section className={styles.landing} onKeyDown={handleKeyDown}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>SNS Gallery</h1>
                    <p className={styles.heroSubtitle}>
                        Capturing moments, creating memories
                    </p>
                </div>
            </div>

            <div className={styles.container}>
                {/* Search & Filter */}
                <div className={styles.controls}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search images..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        <svg
                            className={styles.searchIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    <div className={styles.categories}>
                        {getCategories().map((category) => (
                            <button
                                key={category}
                                className={`${styles.categoryBtn} ${
                                    activeCategory === category ? styles.active : ''
                                }`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gallery Grid */}
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading gallery...</p>
                    </div>
                ) : filteredImages.length === 0 ? (
                    <div className={styles.empty}>
                        <svg
                            className={styles.emptyIcon}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <p>No images found</p>
                    </div>
                ) : (
                    <div className={styles.gallery}>
                        {filteredImages.map((image) => (
                            <div
                                key={image.id}
                                className={styles.galleryItem}
                                onClick={() => openLightbox(image)}
                            >
                                <div className={styles.imageWrapper}>
                                    <CldImage
                                        src={image.url}
                                        alt={image.title || 'Gallery image'}
                                        width={600}
                                        height={400}
                                        crop="fill"
                                        className={styles.image}
                                        quality="auto"
                                        format="auto"
                                        loading="lazy"
                                    />
                                    <div className={styles.overlay}>
                                        <div className={styles.overlayContent}>
                                            <h3>{image.title}</h3>
                                            {image.description && (
                                                <p>{image.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    <button
                        className={styles.closeBtn}
                        onClick={closeLightbox}
                        aria-label="Close"
                    >
                        <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    <div
                        className={styles.lightboxContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.lightboxImage}>
                            <CldImage
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                width={1200}
                                height={800}
                                crop="limit"
                                className={styles.modalImage}
                                quality="auto"
                                format="auto"
                            />
                        </div>

                        <div className={styles.lightboxInfo}>
                            <h2>{selectedImage.title}</h2>
                            {selectedImage.description && (
                                <p className={styles.description}>
                                    {selectedImage.description}
                                </p>
                            )}
                            <div className={styles.meta}>
                                <span className={styles.category}>
                                    {selectedImage.category}
                                </span>
                                {selectedImage.tags.length > 0 && (
                                    <div className={styles.tags}>
                                        {selectedImage.tags.map((tag, idx) => (
                                            <span key={idx} className={styles.tag}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

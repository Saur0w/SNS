"use client";

import styles from './style.module.scss';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface ImageData {
    id: string;
    title: string;
    description: string;
    cloudinaryUrl: string;
    publicId: string;
    tags: string[];
    uploadedAt: string;
    uploadedBy: string;
    dimensions?: {
        width: number;
        height: number;
    };
    fileSize?: string;
    isVisible: boolean;
    featured: boolean;
}

interface CategoryData {
    category: string;
    lastUpdated: string;
    totalImages: number;
    images: ImageData[];
}

interface ApiResponse {
    success: boolean;
    data?: CategoryData;
    error?: string;
    message?: string;
}

export default function Portrait() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');

    const containerRef = useRef<HTMLDivElement>(null);
    const uploadCardRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (loading) return;

        gsap.from(uploadCardRef.current, {
            duration: 0.8,
            y: 30,
            opacity: 0,
            ease: 'power2.out'
        });

        const cards = gsap.utils.toArray(`.${styles.imageCard}`);
        gsap.from(cards, {
            duration: 0.6,
            y: 40,
            opacity: 0,
            stagger: 0.1,
            ease: 'power2.out',
            delay: 0.2
        });

    }, { scope: containerRef, dependencies: [loading, images] });

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async (): Promise<void> => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/portrait', {
                cache: 'no-store'
            });

            const data: ApiResponse = await res.json();

            if (data.success && data.data) {
                setImages(data.data.images || []);
                setMessage('');
            } else {
                setMessage('Failed to load portraits: ' + (data.error || 'Unknown error'));
                setImages([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setMessage('Network error while loading portraits');
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setIsUploading(true);
        setMessage('');

        const form = e.currentTarget;
        const formData = new FormData(form);

        formData.append('category', 'portrait');

        try {
            const uploadRes = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const uploadData = await uploadRes.json();

            if (uploadData.success) {
                setMessage('✅ Portrait uploaded successfully!');
                form.reset();

                gsap.to(`.${styles.message}`, {
                    scale: 1.05,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1
                });

                await fetchImages();
            } else {
                setMessage('❌ Upload failed: ' + (uploadData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            setMessage('❌ Upload failed: Network error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (imageId: string): Promise<void> => {
        if (!confirm('Are you sure you want to delete this portrait? This action cannot be undone.')) {
            return;
        }

        setDeleting(imageId);

        try {
            const res = await fetch(`/api/admin/portrait?id=${encodeURIComponent(imageId)}`, {
                method: 'DELETE',
            });

            const data: ApiResponse = await res.json();

            if (data.success) {
                setMessage('✅ Portrait deleted successfully!');

                const cardElement = document.querySelector(`[data-id="${imageId}"]`);
                if (cardElement) {
                    gsap.to(cardElement, {
                        scale: 0,
                        opacity: 0,
                        duration: 0.4,
                        ease: 'power2.in',
                        onComplete: () => {
                            setImages(prevImages => prevImages.filter(img => img.id !== imageId));
                        }
                    });
                } else {
                    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
                }
            } else {
                setMessage('❌ Delete failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage('❌ Delete failed: Network error');
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleVisibility = async (imageId: string, currentVisibility: boolean): Promise<void> => {
        try {
            const res = await fetch('/api/admin/portrait', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData: {
                        id: imageId,
                        isVisible: !currentVisibility
                    }
                }),
            });

            const data: ApiResponse = await res.json();

            if (data.success) {
                setMessage(`✅ Portrait ${!currentVisibility ? 'published' : 'hidden'} successfully!`);
                setImages(prevImages =>
                    prevImages.map(img =>
                        img.id === imageId
                            ? { ...img, isVisible: !currentVisibility }
                            : img
                    )
                );
            } else {
                setMessage('❌ Update failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Toggle visibility error:', error);
            setMessage('❌ Update failed: Network error');
        }
    };

    const handleToggleFeatured = async (imageId: string, currentFeatured: boolean): Promise<void> => {
        try {
            const res = await fetch('/api/admin/portrait', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData: {
                        id: imageId,
                        featured: !currentFeatured
                    }
                }),
            });

            const data: ApiResponse = await res.json();

            if (data.success) {
                setMessage(`✅ Portrait ${!currentFeatured ? 'featured' : 'unfeatured'} successfully!`);
                setImages(prevImages =>
                    prevImages.map(img =>
                        img.id === imageId
                            ? { ...img, featured: !currentFeatured }
                            : img
                    )
                );
            } else {
                setMessage('❌ Update failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Toggle featured error:', error);
            setMessage('❌ Update failed: Network error');
        }
    };

    const filteredImages = images.filter(img => {
        if (filter === 'visible') return img.isVisible;
        if (filter === 'hidden') return !img.isVisible;
        return true;
    });

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading portraits...</p>
            </div>
        );
    }

    return (
        <div className={styles.portraitSection} ref={containerRef}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h2>🧑‍🎨 Portrait Gallery</h2>
                    <p>Manage your portrait photography collection</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.number}>{images.length}</span>
                        <span className={styles.label}>Total</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.number}>{images.filter(img => img.isVisible).length}</span>
                        <span className={styles.label}>Published</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.number}>{images.filter(img => img.featured).length}</span>
                        <span className={styles.label}>Featured</span>
                    </div>
                </div>
            </div>

            <div className={styles.uploadCard} ref={uploadCardRef}>
                <div className={styles.uploadHeader}>
                    <h3>📤 Upload New Portrait</h3>
                    <div className={styles.uploadHint}>
                        <span>Max size: 10MB • Supported: JPG, PNG, WebP</span>
                    </div>
                </div>

                <form onSubmit={handleUpload} className={styles.uploadForm}>
                    <div className={styles.formGrid}>
                        <div className={styles.fileUpload}>
                            <input
                                id="file"
                                name="file"
                                type="file"
                                accept="image/*"
                                required
                                disabled={isUploading}
                                className={styles.fileInput}
                            />
                            <label htmlFor="file" className={styles.fileLabel}>
                                <div className={styles.fileIcon}>📷</div>
                                <span>Choose Image</span>
                            </label>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="title">Title *</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                placeholder="Enter portrait title"
                                required
                                disabled={isUploading}
                                className={styles.textInput}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Describe this portrait..."
                                rows={3}
                                disabled={isUploading}
                                className={styles.textarea}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="tags">Tags</label>
                            <input
                                id="tags"
                                name="tags"
                                type="text"
                                placeholder="portrait, photography, art"
                                disabled={isUploading}
                                className={styles.textInput}
                            />
                            <small>Separate tags with commas</small>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className={styles.uploadBtn}
                    >
                        {isUploading ? (
                            <>
                                <div className={styles.btnSpinner}></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <span>📤</span>
                                Upload Portrait
                            </>
                        )}
                    </button>
                </form>

                {message && (
                    <div className={`${styles.message} ${message.startsWith('❌') ? styles.error : styles.success}`}>
                        {message}
                    </div>
                )}
            </div>

            <div className={styles.gallerySection}>
                <div className={styles.galleryHeader}>
                    <div className={styles.galleryTitle}>
                        <h3>Portrait Collection</h3>
                        <button
                            onClick={fetchImages}
                            className={styles.refreshBtn}
                            title="Refresh gallery"
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({images.length})
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'visible' ? styles.active : ''}`}
                            onClick={() => setFilter('visible')}
                        >
                            Published ({images.filter(img => img.isVisible).length})
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'hidden' ? styles.active : ''}`}
                            onClick={() => setFilter('hidden')}
                        >
                            Hidden ({images.filter(img => !img.isVisible).length})
                        </button>
                    </div>
                </div>

                <div className={styles.imageGrid}>
                    {filteredImages.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🖼️</div>
                            <h4>No portraits found</h4>
                            <p>
                                {filter === 'all'
                                    ? 'Start by uploading your first portrait above'
                                    : `No ${filter} portraits found. Try changing the filter.`
                                }
                            </p>
                        </div>
                    ) : (
                        filteredImages.map((image) => (
                            <div
                                key={image.id}
                                data-id={image.id}
                                className={styles.imageCard}
                            >
                                <div className={styles.imageWrapper}>
                                    <img
                                        src={image.cloudinaryUrl}
                                        alt={image.title}
                                        loading="lazy"
                                        className={styles.image}
                                    />

                                    <div className={styles.badges}>
                                        {!image.isVisible && (
                                            <span className={styles.hiddenBadge}>Hidden</span>
                                        )}
                                        {image.featured && (
                                            <span className={styles.featuredBadge}>⭐ Featured</span>
                                        )}
                                    </div>

                                    <div className={styles.actionButtons}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleToggleVisibility(image.id, image.isVisible)}
                                            title={image.isVisible ? 'Hide from public' : 'Publish to public'}
                                        >
                                            {image.isVisible ? '👁️' : '🙈'}
                                        </button>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleToggleFeatured(image.id, image.featured)}
                                            title={image.featured ? 'Remove from featured' : 'Add to featured'}
                                        >
                                            {image.featured ? '⭐' : '☆'}
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            onClick={() => handleDelete(image.id)}
                                            disabled={deleting === image.id}
                                            title="Delete image"
                                        >
                                            {deleting === image.id ? '⏳' : '🗑️'}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.imageInfo}>
                                    <h4>{image.title}</h4>
                                    {image.description && (
                                        <p className={styles.description}>{image.description}</p>
                                    )}

                                    {image.tags && image.tags.length > 0 && (
                                        <div className={styles.tags}>
                                            {image.tags.map((tag, index) => (
                                                <span key={index} className={styles.tag}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={styles.metadata}>
                                        <span className={styles.date}>
                                            {new Date(image.uploadedAt).toLocaleDateString()}
                                        </span>
                                        {image.fileSize && (
                                            <span className={styles.size}>{image.fileSize}</span>
                                        )}
                                        {image.dimensions && (
                                            <span className={styles.dimensions}>
                                                {image.dimensions.width} × {image.dimensions.height}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

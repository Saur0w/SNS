"use client";

import styles from './style.module.scss';
import { useState } from 'react';

export default function Landscape() {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [images, setImages] = useState([
        {
            id: 1,
            title: "Mountain Vista",
            url: "https://via.placeholder.com/400x300",
            description: "Stunning mountain landscape"
        },
        {
            id: 2,
            title: "Ocean Sunset",
            url: "https://via.placeholder.com/400x300",
            description: "Beautiful ocean sunset view"
        }
    ]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setMessage('');

        try {
            setTimeout(() => {
                setMessage('✅ Landscape uploaded successfully!');
                setIsUploading(false);
                const form = e.target as HTMLFormElement;
                form.reset();
            }, 2000);
        } catch (error) {
            setMessage('❌ Upload failed');
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.landscapeSection}>
            <div className={styles.header}>
                <div>
                    <h2>🏔️ Landscape Gallery</h2>
                    <p>Manage your landscape photography collection</p>
                </div>
                <div className={styles.stats}>
                    <span className={styles.badge}>{images.length} Images</span>
                </div>
            </div>

            {/* Upload Form */}
            <div className={styles.uploadCard}>
                <h3>Upload New Landscape</h3>
                <form onSubmit={handleUpload} className={styles.uploadForm}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Select Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                required
                                className={styles.fileInput}
                            />
                            <small>Max size: 10MB</small>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Title</label>
                            <input
                                type="text"
                                placeholder="Enter landscape title"
                                className={styles.textInput}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            placeholder="Describe this landscape..."
                            rows={3}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tags</label>
                        <input
                            type="text"
                            placeholder="landscape, nature, mountain, sunset"
                            className={styles.textInput}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className={styles.uploadBtn}
                    >
                        {isUploading ? 'Uploading...' : '📤 Upload Landscape'}
                    </button>
                </form>

                {message && (
                    <div className={`${styles.message} ${message.startsWith('❌') ? styles.error : styles.success}`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Images Grid */}
            <div className={styles.galleryCard}>
                <h3>Landscape Collection</h3>
                <div className={styles.imageGrid}>
                    {images.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No landscapes uploaded yet</p>
                            <span>Start by uploading your first landscape above</span>
                        </div>
                    ) : (
                        images.map((image) => (
                            <div key={image.id} className={styles.imageCard}>
                                <div className={styles.imageWrapper}>
                                    <img src={image.url} alt={image.title} />
                                    <div className={styles.imageOverlay}>
                                        <button className={styles.deleteBtn}>🗑️</button>
                                        <button className={styles.editBtn}>✏️</button>
                                    </div>
                                </div>
                                <div className={styles.imageInfo}>
                                    <h4>{image.title}</h4>
                                    <p>{image.description}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

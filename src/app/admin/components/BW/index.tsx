"use client";

import styles from './style.module.scss';
import { useState } from 'react';

export default function BW() {
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [images, setImages] = useState([
        {
            id: 1,
            title: "Street Photography",
            url: "https://via.placeholder.com/350x350/000000/FFFFFF",
            description: "Classic black and white street scene"
        },
        {
            id: 2,
            title: "Architecture Study",
            url: "https://via.placeholder.com/350x350/000000/FFFFFF",
            description: "Modern architecture in monochrome"
        }
    ]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setMessage('');

        try {
            setTimeout(() => {
                setMessage('✅ B&W image uploaded successfully!');
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
        <div className={styles.bwSection}>
            <div className={styles.header}>
                <div>
                    <h2>⚫ Black & White Gallery</h2>
                    <p>Manage your monochrome photography collection</p>
                </div>
                <div className={styles.stats}>
                    <span className={styles.badge}>{images.length} Images</span>
                </div>
            </div>

            {/* Upload Form */}
            <div className={styles.uploadCard}>
                <h3>Upload New B&W Image</h3>
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
                            <small>Max size: 10MB • We&#39;ll convert to B&W if needed</small>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Title</label>
                            <input
                                type="text"
                                placeholder="Enter B&W title"
                                className={styles.textInput}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            placeholder="Describe this B&W image..."
                            rows={3}
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tags</label>
                        <input
                            type="text"
                            placeholder="black and white, monochrome, artistic"
                            className={styles.textInput}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className={styles.uploadBtn}
                    >
                        {isUploading ? 'Uploading...' : '📤 Upload B&W Image'}
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
                <h3>B&W Collection</h3>
                <div className={styles.imageGrid}>
                    {images.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No B&W images uploaded yet</p>
                            <span>Start by uploading your first monochrome image above</span>
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

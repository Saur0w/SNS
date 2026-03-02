"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./style.module.scss";
import { CldImage, CldUploadWidget } from 'next-cloudinary';
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary';

interface ImageData {
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
}

interface FormDataState {
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
}

interface CloudinaryInfo {
    secure_url: string;
    public_id: string;
    [key: string]: unknown;
}

// FIX 3: single source of truth for empty form
const EMPTY_FORM: FormDataState = {
    url: '',
    title: '',
    description: '',
    category: 'general',
    tags: [],
};

export default function GalleryAdmin() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    // FIX 2: uploadError now rendered in JSX below
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormDataState>(EMPTY_FORM);

    const loadImages = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gallery');
            if (response.ok) {
                const data = await response.json() as { images: ImageData[] };
                setImages(data.images || []);
            }
        } catch {
            console.error('Error loading images');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, tags }));
    };

    const startEditingImage = (image: ImageData): void => {
        setFormData({
            url: image.url,
            title: image.title,
            description: image.description,
            category: image.category,
            tags: image.tags,
        });
        setEditingImageId(image.id);
        setIsEditing(true);
    };

    const handleUploadSuccess = (result: CloudinaryUploadWidgetResults): void => {
        if (result.event === 'success' && result.info && typeof result.info !== 'string') {
            const info = result.info as CloudinaryInfo;
            setFormData(prev => ({ ...prev, url: info.secure_url }));
            setUploadError(null);
        }
    };

    // FIX 3: one shared cancel/reset so both Cancel and post-save are consistent
    const cancelEditing = (): void => {
        setIsEditing(false);
        setEditingImageId(null);
        setFormData(EMPTY_FORM);
        setUploadError(null);
    };

    const saveImage = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const isUpdate = !!editingImageId;
            const method = isUpdate ? 'PUT' : 'POST';
            const body = isUpdate
                ? { imageId: editingImageId, imageData: formData }
                : { image: formData };

            const response = await fetch('/api/gallery', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                cancelEditing();
                await loadImages();
            } else {
                const err = await response.json() as { error?: string };
                alert(err.error || "Failed to save");
            }
        } catch { // FIX 1: bare catch — error was declared but never used
            alert("Network error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteImage = async (id: string): Promise<void> => {
        if (!confirm('Permanently delete this item?')) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
            if (response.ok) await loadImages();
        } catch { // FIX 1: bare catch — error was declared but never used
            alert("Delete failed");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className={styles.admin}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Archive CMS</h1>
                    {!isEditing && (
                        <button className={styles.createBtn} onClick={() => {
                            setFormData(EMPTY_FORM);
                            setEditingImageId(null);
                            setIsEditing(true);
                        }}>
                            + New Entry
                        </button>
                    )}
                </header>

                <main className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loading}><span className={styles.loader}></span></div>
                    ) : !isEditing ? (
                        <div className={styles.imagesGrid}>
                            {images.map((image) => (
                                <div key={image.id} className={styles.imageCard}>
                                    <div className={styles.imageWrapper}>
                                        <CldImage src={image.url} alt={image.title} width={400} height={400} crop="fill" />
                                    </div>
                                    <div className={styles.imageContent}>
                                        <h3>{image.title}</h3>
                                        <div className={styles.imageActions}>
                                            <button className={styles.editBtn} onClick={() => startEditingImage(image)}>Edit</button>
                                            <button className={styles.deleteBtn} onClick={() => deleteImage(image.id)}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.imageEditor}>
                            <form onSubmit={saveImage} className={styles.form}>
                                <div className={styles.editorTop}>
                                    <h2>{editingImageId ? 'Edit Entry' : 'New Entry'}</h2>
                                    {/* FIX 3: uses cancelEditing instead of bare setIsEditing */}
                                    <button type="button" className={styles.cancelBtn} onClick={cancelEditing}>Cancel</button>
                                </div>

                                {/* FIX 2: uploadError is now actually rendered */}
                                {uploadError && (
                                    <p className={styles.uploadError}>{uploadError}</p>
                                )}

                                <div className={styles.uploadSection}>
                                    {formData.url ? (
                                        <div className={styles.previewContainer}>
                                            <CldImage src={formData.url} alt="Preview" width={800} height={500} crop="fit" />
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, url: '' }))}>Change Image</button>
                                        </div>
                                    ) : (
                                        <CldUploadWidget
                                            uploadPreset="sns_gallery"
                                            onSuccess={handleUploadSuccess}
                                            config={{
                                                cloud: {
                                                    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                                                }
                                            }}
                                        >
                                            {({ open }) => (
                                                <div className={styles.uploadPlaceholder} onClick={() => open()}>
                                                    <span>Click to upload image</span>
                                                </div>
                                            )}
                                        </CldUploadWidget>
                                    )}
                                </div>

                                <div className={styles.formFields}>
                                    <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Entry Title" required />
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" rows={3} />
                                    <div className={styles.formRow}>
                                        <select name="category" value={formData.category} onChange={handleInputChange}>
                                            <option value="general">General</option>
                                            <option value="nature">Nature</option>
                                            <option value="architecture">Architecture</option>
                                        </select>
                                        <input value={formData.tags.join(', ')} onChange={handleTagsChange} placeholder="Tags (comma separated)" />
                                    </div>
                                </div>

                                <button type="submit" className={styles.saveBtn} disabled={isSaving || !formData.url}>
                                    {isSaving ? 'Processing...' : 'Save Entry'}
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </section>
    );
}
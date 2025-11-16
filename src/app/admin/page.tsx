"use client";

import { useState, useEffect } from "react";
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
    uploadedAt?: string;
    updatedAt?: string;
}

interface FormDataState {
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
}

export default function GalleryAdmin() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormDataState>({
        url: '',
        title: '',
        description: '',
        category: 'general',
        tags: []
    });

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gallery');
            if (response.ok) {
                const data = await response.json();
                setImages(data.images || []);
            } else {
                console.error('Failed to load images:', response.statusText);
                setImages([]);
            }
        } catch (error) {
            console.error('Error loading images:', error);
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const tags = e.target.value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        setFormData(prev => ({
            ...prev,
            tags: tags
        }));
    };

    const startCreating = (): void => {
        setFormData({
            url: '',
            title: '',
            description: '',
            category: 'general',
            tags: []
        });
        setIsEditing(true);
        setEditingImageId(null);
        setUploadError(null);
    };

    const startEditingImage = (image: ImageData): void => {
        setFormData({
            url: image.url,
            title: image.title || '',
            description: image.description || '',
            category: image.category || 'general',
            tags: image.tags || []
        });
        setIsEditing(true);
        setEditingImageId(image.id);
        setUploadError(null);
    };

    const cancelEditing = (): void => {
        setIsEditing(false);
        setEditingImageId(null);
        setFormData({
            url: '',
            title: '',
            description: '',
            category: 'general',
            tags: []
        });
        setUploadError(null);
    };

    const handleUploadSuccess = (result: CloudinaryUploadWidgetResults): void => {
        try {
            if (result.event === 'success' && result.info && typeof result.info !== 'string') {
                const imageUrl = result.info.secure_url || result.info.url || result.info.public_id;
                setFormData(prev => ({
                    ...prev,
                    url: imageUrl
                }));
                setUploadError(null);
            }
        } catch (error) {
            console.error('Upload success handler error:', error);
            setUploadError('Error processing uploaded image');
        }
    };

    const handleUploadError = (error: unknown): void => {
        console.error('Upload error:', error);
        setUploadError('Failed to upload image. Please try again.');
    };

    const saveImage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setUploadError(null);

        try {
            if (editingImageId) {
                // Update existing image
                const response = await fetch('/api/gallery', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'update',
                        imageId: editingImageId,
                        imageData: formData
                    }),
                });

                if (response.ok) {
                    setIsEditing(false);
                    setEditingImageId(null);
                    await loadImages();
                    alert('Image updated successfully!');
                } else {
                    const errorData = await response.json();
                    alert(`Error updating image: ${errorData.error || 'Unknown error'}`);
                }
            } else {
                // Create new image
                const response = await fetch('/api/gallery', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: formData
                    }),
                });

                if (response.ok) {
                    setIsEditing(false);
                    await loadImages();
                    alert('Image added successfully!');
                } else {
                    const errorData = await response.json();
                    alert(`Error adding image: ${errorData.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Error saving image:', error);
            alert(`Error saving image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteImage = async (imageId: string): Promise<void> => {
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/gallery', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    imageId: imageId
                }),
            });

            if (response.ok) {
                await loadImages();
                alert('Image deleted successfully!');
            } else {
                const errorData = await response.json();
                alert(`Error deleting image: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(`Error deleting image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className={styles.admin}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Gallery Management</h1>
                </header>

                <main className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : !isEditing ? (
                        <div className={styles.galleryList}>
                            <div className={styles.galleryHeader}>
                                <h2>Gallery Images ({images.length})</h2>
                                <button
                                    className={styles.createBtn}
                                    onClick={startCreating}
                                >
                                    Add New Image
                                </button>
                            </div>

                            {images.length === 0 ? (
                                <div className={styles.noImages}>
                                    <p>No images found. Add your first image!</p>
                                </div>
                            ) : (
                                <div className={styles.imagesGrid}>
                                    {images.map((image, index) => (
                                        <div key={image.id || index} className={styles.imageCard}>
                                            <div className={styles.imageWrapper}>
                                                <CldImage
                                                    src={image.url}
                                                    alt={image.title || 'Gallery image'}
                                                    width={300}
                                                    height={300}
                                                    crop="fill"
                                                    className={styles.cardImg}
                                                    quality="auto"
                                                    format="auto"
                                                />
                                            </div>
                                            <div className={styles.imageContent}>
                                                <h3>{image.title || 'Untitled'}</h3>
                                                <p className={styles.imageDescription}>
                                                    {image.description || 'No description'}
                                                </p>
                                                <div className={styles.imageMeta}>
                                                    <span className={styles.category}>
                                                        {image.category || 'general'}
                                                    </span>
                                                    {image.tags && image.tags.length > 0 && (
                                                        <span className={styles.tags}>
                                                            {image.tags.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.imageActions}>
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => startEditingImage(image)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={() => deleteImage(image.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.imageEditor}>
                            <div className={styles.editorHeader}>
                                <h2>{editingImageId ? 'Edit Image' : 'Add New Image'}</h2>
                                <button
                                    className={styles.cancelBtn}
                                    onClick={cancelEditing}
                                >
                                    Cancel
                                </button>
                            </div>

                            {uploadError && (
                                <div className={styles.errorMessage}>
                                    {uploadError}
                                </div>
                            )}

                            <form onSubmit={saveImage} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Image Upload *</label>
                                    {formData.url ? (
                                        <div className={styles.imagePreview}>
                                            <CldImage
                                                src={formData.url}
                                                alt="Preview"
                                                width={600}
                                                height={400}
                                                crop="fill"
                                                className={styles.previewImg}
                                                quality="auto"
                                                format="auto"
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeImage}
                                                onClick={() => setFormData(prev => ({ ...prev, url: '' }))}
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    ) : (
                                        <CldUploadWidget
                                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                            options={{
                                                sources: ['local', 'url', 'camera'],
                                                multiple: false,
                                                maxFiles: 1,
                                                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                                                maxFileSize: 50000000,
                                                folder: 'gallery',
                                                resourceType: 'image',
                                                cropping: false,
                                                tags: ['gallery_image']
                                            }}
                                            onSuccess={handleUploadSuccess}
                                            onError={handleUploadError}
                                        >
                                            {({ open }) => (
                                                <button
                                                    type="button"
                                                    className={styles.uploadButton}
                                                    onClick={() => open()}
                                                >
                                                    Upload Image
                                                </button>
                                            )}
                                        </CldUploadWidget>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Image title"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Image description"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                        >
                                            <option value="general">General</option>
                                            <option value="nature">Nature</option>
                                            <option value="architecture">Architecture</option>
                                            <option value="people">People</option>
                                            <option value="technology">Technology</option>
                                            <option value="art">Art</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Tags (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={formData.tags.join(', ')}
                                            onChange={handleTagsChange}
                                            placeholder="landscape, sunset, travel"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button
                                        type="submit"
                                        className={styles.saveBtn}
                                        disabled={isLoading || !formData.url}
                                    >
                                        {isLoading ? 'Saving...' : (editingImageId ? 'Update Image' : 'Add Image')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </section>
    );
}

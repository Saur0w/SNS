"use client";

import { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { CldImage } from "next-cloudinary";

interface ImageData {
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
}

export default function Landing() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/gallery");

            if (response.ok) {
                const data = await response.json();
                setImages(data.images || []);
            } else {
                setImages([]);
            }
        } catch (error) {
            console.error("Error loading gallery:", error);
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.landing}>
            <main className={styles.main}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <p>Loading photos...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No photos yet. Upload some from the admin panel!</p>
                    </div>
                ) : (
                    <div className={styles.galleryWrapper}>
                        <div className={styles.gallery}>
                            {images.map((image) => (
                                <div key={image.id} className={styles.card}>
                                    <CldImage
                                        src={image.url}
                                        alt={image.title || "Gallery image"}
                                        width={400}
                                        height={300}
                                        crop="fill"
                                        className={styles.photo}
                                        quality="auto"
                                        format="auto"
                                    />
                                    <div className={styles.info}>
                                        <h3>{image.title || "Untitled"}</h3>
                                        {image.description && <p>{image.description}</p>}
                                        {image.category && (
                                            <span className={styles.category}>
                        {image.category}
                      </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

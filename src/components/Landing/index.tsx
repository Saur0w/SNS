"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./style.module.scss";
import { CldImage } from "next-cloudinary";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ImageData {
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
}

export default function Landing() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

    const galleryRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const scrollState = useRef({
        current: 0,
        target: 0,
        limit: 0,
    });

    const loadGallery = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch("/api/gallery");
            if (response.ok) {
                const data = await response.json() as { images: ImageData[] };
                setImages(data.images || []);
            }
        } catch (error) {
            console.error("Gallery failed to load", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGallery();
    }, [loadGallery]);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper || isLoading) return;

        const updateLimit = () => {
            scrollState.current.limit = wrapper.scrollWidth - window.innerWidth;
        };

        updateLimit();
        window.addEventListener("resize", updateLimit);

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            scrollState.current.target += (e.deltaY + e.deltaX) * 1.2;
        };

        wrapper.addEventListener("wheel", handleWheel, { passive: false });

        let rafId: number;
        const animate = () => {
            const state = scrollState.current;
            state.target = Math.max(0, Math.min(state.target, state.limit));
            state.current += (state.target - state.current) * 0.08;
            wrapper.scrollLeft = state.current;
            ScrollTrigger.update();
            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", updateLimit);
            wrapper.removeEventListener("wheel", handleWheel);
            cancelAnimationFrame(rafId);
        };
    }, [images, isLoading]);

    useGSAP(() => {
        if (!images.length) return;

        const cards = gsap.utils.toArray(`.${styles.card}`);

        gsap.fromTo(
            cards,
            { opacity: 0, y: 50, scale: 0.9 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                stagger: 0.05,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: galleryRef.current,
                    scroller: wrapperRef.current,
                    horizontal: true,
                    start: "left 90%",
                },
            }
        );
    }, { dependencies: [images], scope: galleryRef });

    return (
        <section className={styles.landing}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <h1>Archive <span className={styles.count}>{images.length}</span></h1>
                </div>
            </header>

            <main className={styles.scrollWrapper} ref={wrapperRef}>
                {isLoading ? (
                    <div className={styles.loading}><div className={styles.spinner}></div></div>
                ) : (
                    <div className={styles.gallery} ref={galleryRef}>
                        {images.map((image) => (
                            <div key={image.id} className={styles.card} onClick={() => setSelectedImage(image)}>
                                <div className={styles.imageContainer}>
                                    <CldImage
                                        src={image.url}
                                        alt={image.title}
                                        width={500}
                                        height={500}
                                        crop="fill"
                                        className={styles.photo}
                                    />
                                </div>
                                <div className={styles.meta}>
                                    <span className={styles.id}>Open</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {selectedImage && (
                <div className={styles.modal} onClick={() => setSelectedImage(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedImage(null)}>&times;</button>
                        <div className={styles.modalImageWrapper}>
                            <CldImage
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                width={1200}
                                height={800}
                            />
                        </div>
                        <div className={styles.modalInfo}>
                            <h2>{selectedImage.title}</h2>
                            <p>{selectedImage.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
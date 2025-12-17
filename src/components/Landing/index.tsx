"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./style.module.scss";
import { CldImage } from "next-cloudinary";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

    const galleryRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const scrollState = useRef({
        current: 0,
        target: 0,
        limit: 0
    });

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
            }
        } catch (error) {
            console.error("Error loading gallery:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper || isLoading) return;

        const updateLimit = () => {
            scrollState.current.limit = wrapper.scrollWidth - window.innerWidth;
        };

        updateLimit();
        window.addEventListener('resize', updateLimit);

        const handleWheel = (evt: WheelEvent) => {
            if (Math.abs(evt.deltaY) > Math.abs(evt.deltaX)) {
                evt.preventDefault();
                scrollState.current.target += evt.deltaY;
            } else {
                scrollState.current.target += evt.deltaX;
            }
        };

        wrapper.addEventListener("wheel", handleWheel, { passive: false });

        let rafId: number;
        const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

        const animateScroll = () => {
            const state = scrollState.current;

            state.target = Math.max(0, Math.min(state.target, state.limit));

            state.current = lerp(state.current, state.target, 0.08);

            if (wrapper) {
                wrapper.scrollLeft = state.current;
            }

            rafId = requestAnimationFrame(animateScroll);
        };

        rafId = requestAnimationFrame(animateScroll);

        return () => {
            window.removeEventListener('resize', updateLimit);
            wrapper.removeEventListener("wheel", handleWheel);
            cancelAnimationFrame(rafId);
        };
    }, [images, isLoading]);

    useGSAP(() => {
        if (images.length > 0 && galleryRef.current) {
            const cards = gsap.utils.toArray<HTMLElement>(`.${styles.card}`);

            gsap.fromTo(cards,
                { opacity: 0, scale: 0.8 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    stagger: {
                        amount: 1,
                        grid: "auto",
                        from: "start"
                    },
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: galleryRef.current,
                        horizontal: true,
                        start: "left right",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }
    }, { dependencies: [images], scope: galleryRef });

    useGSAP(() => {
        if (selectedImage && modalRef.current) {
            gsap.fromTo(modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.4, ease: "power2.out" }
            );
            gsap.fromTo(".modalImage",
                { scale: 0.9, y: 20 },
                { scale: 1, y: 0, duration: 0.6, delay: 0.1, ease: "back.out(1.2)" }
            );
        }
    }, [selectedImage]);

    return (
        <section className={styles.landing}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <h1>Archive <span className={styles.count}>{images.length}</span></h1>
                </div>
            </header>

            <main className={styles.scrollWrapper} ref={wrapperRef}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : (
                    <div className={styles.gallery} ref={galleryRef}>
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className={styles.card}
                                onClick={() => setSelectedImage(image)} // Open Modal
                            >
                                <div className={styles.imageContainer}>
                                    <CldImage
                                        src={image.url}
                                        alt={image.title || "Gallery Photo"}
                                        width={400}
                                        height={400}
                                        crop="fill"
                                        className={styles.photo}
                                        quality="auto"
                                        format="auto"
                                    />
                                </div>
                                <div className={styles.meta}>
                                    <span className={styles.id}>View</span>
                                </div>
                            </div>
                        ))}
                        <div className={styles.spacer}></div>
                    </div>
                )}
            </main>

            {selectedImage && (
                <div className={styles.modal} ref={modalRef} onClick={() => setSelectedImage(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedImage(null)}>×</button>

                        <div className={styles.modalImageWrapper}>
                            <CldImage
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                width={1200}
                                height={900}
                                preserveTransformations
                                className="modalImage"
                            />
                        </div>

                        <div className={styles.modalInfo}>
                            <h2>{selectedImage.title || "Untitled"}</h2>
                            <p>{selectedImage.category} — {selectedImage.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

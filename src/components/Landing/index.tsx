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
    const galleryRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadGallery();
    }, []);

    // Load Data
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

    // Horizontal Scroll Logic (Wheel -> Horizontal)
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const handleWheel = (evt: WheelEvent) => {
            if (evt.deltaY !== 0) {
                // Prevent default vertical scroll
                // Scroll left/right based on deltaY
                wrapper.scrollLeft += evt.deltaY;
            }
        };

        wrapper.addEventListener("wheel", handleWheel, { passive: true }); // passive true for better performance
        return () => wrapper.removeEventListener("wheel", handleWheel);
    }, [isLoading]);

    // GSAP Animations
    useGSAP(() => {
        if (images.length > 0 && galleryRef.current) {
            const cards = gsap.utils.toArray<HTMLElement>(`.${styles.card}`);

            // Animate cards in from right/bottom staggered
            gsap.fromTo(cards,
                {
                    opacity: 0,
                    scale: 0.8,
                    x: 50
                },
                {
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    duration: 0.8,
                    stagger: {
                        amount: 1,
                        grid: "auto",
                        from: "start"
                    },
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: galleryRef.current,
                        horizontal: true, // Important for horizontal layout
                        start: "left right",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }
    }, { dependencies: [images], scope: galleryRef });

    return (
        <section className={styles.landing}>
            {/* Fixed Header overlay */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <h1>Archive <span className={styles.count}>{images.length}</span></h1>
                </div>
            </header>

            {/* Horizontal Scroll Container */}
            <main className={styles.scrollWrapper} ref={wrapperRef}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : (
                    <div className={styles.gallery} ref={galleryRef}>
                        {images.map((image) => (
                            <div key={image.id} className={styles.card}>
                                <div className={styles.imageContainer}>
                                    <CldImage
                                        src={image.url}
                                        alt={image.title || "Gallery Photo"}
                                        width={400}
                                        height={400} // Square/Small aspect ratio
                                        crop="fill"
                                        className={styles.photo}
                                        quality="auto"
                                        format="auto"
                                    />
                                </div>
                                <div className={styles.meta}>
                                    <span className={styles.id}>#{image.id.slice(-4)}</span>
                                </div>
                            </div>
                        ))}
                        {/* Spacer at end for comfortable scrolling */}
                        <div className={styles.spacer}></div>
                    </div>
                )}
            </main>
        </section>
    );
}

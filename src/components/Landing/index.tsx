"use client";

import styles from './style.module.scss';
import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ImageData {
    id: number;
    title: string;
    description: string;
    url: string;
}

interface ApiResponse {
    success: boolean;
    images: ImageData[];
    error?: string;
}

export default function Landing() {
    const landingRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/images?fresh=true');
                const result: ApiResponse = await response.json();

                if (result.success && result.images) {
                    setImages(result.images);
                    console.log('✅ Images loaded from API:', result.images.length); // Add this
                } else {
                    throw new Error(result.error || 'Failed to fetch images');
                }
            } catch (err) {
                console.error('❌ API Error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load images');

                setImages([
                    {
                        id: 1,
                        title: "Sample Image 1",
                        description: "Fallback Image",
                        url: "/images/image1.jpg"
                    },
                    {
                        id: 2,
                        title: "Sample Image 2",
                        description: "Fallback image",
                        url: "/images/image2.jpg"
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    const addToRefs = (el: HTMLDivElement | null, index: number) => {
        if (el && !imageRefs.current[index]) {
            imageRefs.current[index] = el;
        }
    };

    useGSAP(() => {
        const container = containerRef.current;
        const landing = landingRef.current;

        if (!container || !landing) return;

        gsap.set(landing, {
            visibility: "visible"
        });

        gsap.from(container, {
            xPercent: -100,
            duration: 1.5,
            ease: "power2.out"
        });

        imageRefs.current.forEach((imageWrapper, index) => {
            if (imageWrapper) {
                gsap.from(imageWrapper, {
                    xPercent: 100,
                    scale: 1.3,
                    duration: 1.5,
                    delay: index * 0.1,
                    ease: "power2.out"
                });
            }
        });

        const getScrollAmount = () => {
            const containerWidth = container.scrollWidth;
            const viewportWidth = window.innerWidth;
            return -(containerWidth - viewportWidth);
        };


        setTimeout(() => {
            if (container.scrollWidth > window.innerWidth) {
                const horizontalTween = gsap.to(container, {
                    x: getScrollAmount,
                    duration: 3,
                    ease: "none"
                });

                ScrollTrigger.create({
                    trigger: landing,
                    start: "top top",
                    end: () => `+=${Math.abs(getScrollAmount())}`,
                    pin: true,
                    animation: horizontalTween,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    anticipatePin: 1
                });
            }
        }, 100);

    }, { scope: landingRef, dependencies: [images, loading] });

    if (loading) {
        return (
            <section className={styles.landing}>
                <div className={styles.loading}>
                    <p>Loading gallery...</p>
                </div>
            </section>
        );
    }

    if (error) {
        console.warn('Using fallback images due to API error:', error);
    }

    return (
        <section className={styles.landing} ref={landingRef}>
            <div className={styles.container} ref={containerRef}>
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className={styles.imageWrapper}
                        ref={(el) => addToRefs(el, index)}
                    >
                        <Image
                            src={image.url}
                            alt={image.title}
                            width={220}
                            height={80}
                            priority={image.id <= 2}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

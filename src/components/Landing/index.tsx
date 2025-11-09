"use client";

import styles from './style.module.scss';
import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

gsap.registerPlugin(ScrollTrigger, useGSAP);

[const PHOTO_TYPES = ['Portrait', 'Landscape', 'B&W'] as const;
type PhotoType = typeof PHOTO_TYPES[number];]

interface ImageData {
    id: number;
    url: string;
    type: PhotoType;
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
    const router = useRouter();

    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleImageClick = async (imageType: PhotoType) => {
        try {
            if (!imageType) {
                throw new Error('Image type is undefined');
            }

            const routeMap: Record<PhotoType, string> = {
                'Portrait': '/portrait',
                'Landscape': '/landscape',
                'B&W': '/bw'
            };

            const route = routeMap[imageType];

            if (!route) {
                throw new Error(`No route found for image type: ${imageType}`);
            }

            await router.push(route);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };


    useEffect(() => {
        const fetchImages = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/images?fresh=true');
                const result: ApiResponse = await response.json();

                if (result.success && result.images) {
                    setImages(result.images);
                    console.log('Images loaded from API:', result.images.length);
                } else {
                    throw new Error(result.error || 'Failed to fetch images');
                }
            } catch (err) {
                console.error('API Error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load images');

                setImages([
                    {
                        id: 1,
                        url: "/images/image1.jpg"
                    },
                    {
                        id: 2,
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
                        onClick={() => handleImageClick(image.type)}
                        ref={(el) => addToRefs(el, index)}
                    >
                        <Image
                            src={image.url}
                            alt={image.id}
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

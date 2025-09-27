"use client";

import styles from './style.module.scss';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ImageData {
    id: number;
    src: string;
    alt: string;
}

const img: ImageData[] = [
    {
        id: 1,
        src: '/images/image1.jpg',
        alt: 'image 1',
    },
    {
        id: 2,
        src: '/images/image2.jpg',
        alt: 'image 2',
    },
    {
        id: 3,
        src: '/images/image3.jpg',
        alt: 'image 3',
    },
    {
        id: 4,
        src: '/images/image4.jpg',
        alt: 'image 4',
    },
    {
        id: 5,
        src: '/images/image5.jpg',
        alt: 'image 5',
    },
    {
        id: 6,
        src: '/images/image6.jpg',
        alt: 'image 6',
    },
    {
        id: 7,
        src: '/images/image7.jpg',
        alt: 'image 7',
    },
    {
        id: 8,
        src: '/images/image8.jpg',
        alt: 'image 8',
    },
    {
        id: 9,
        src: '/images/image9.jpg',
        alt: 'image 9',
    },
    {
        id: 10,
        src: '/images/image10.jpg',
        alt: 'image 10',
    },
    {
        id: 11,
        src: '/images/image11.jpg',
        alt: 'image 11',
    },
    {
        id: 12,
        src: '/images/image12.jpg',
        alt: 'image 12',
    },
    {
        id: 13,
        src: '/images/image13.jpg',
        alt: 'image 13'
    },
    {
        id: 14,
        src: '/images/image14.jpg',
        alt: 'image 14'
    },
    {
        id: 15,
        src: '/images/image15.jpg',
        alt: 'image 15'
    },
    {
        id: 16,
        src: '/images/image16.jpg',
        alt: 'image 16'
    },
    {
        id: 17,
        src: '/images/image17.jpg',
        alt: 'image 17',
    },
    {
        id: 18,
        src: '/images/image18.jpg',
        alt: 'image 18',
    },
    {
        id: 19,
        src: '/images/image19.jpg',
        alt: 'image 19',
    },
    {
        id: 20,
        src: '/images/image20.jpg',
        alt: 'image 21',
    },
    {
        id: 21,
        src: '/images/image21.jpg',
        alt: 'image 5 (duplicate)',
    },
    {
        id: 22,
        src: '/images/image22.jpg',
        alt: 'image 6 (duplicate)',
    },
    {
        id: 23,
        src: '/images/image23.jpg',
        alt: 'image 7 (duplicate)',
    },
    {
        id: 24,
        src: '/images/image24.jpg',
        alt: 'image 8 (duplicate)',
    },
    {
        id: 25,
        src: '/images/image25.jpg',
        alt: 'image 9 (duplicate)',
    },
    {
        id: 26,
        src: '/images/image26.jpg',
        alt: 'image 10 (duplicate)',
    },
    {
        id: 27,
        src: '/images/image27.jpg',
        alt: 'image 11 (duplicate)',
    },
    {
        id: 28,
        src: '/images/image28.jpg',
        alt: 'image 12 (duplicate)',
    },
    {
        id: 29,
        src: '/images/image29.jpg',
        alt: 'image 13 (duplicate)'
    },
    {
        id: 30,
        src: '/images/image30.jpg',
        alt: 'image 14 (duplicate)'
    },
    {
        id: 31,
        src: '/images/Preloader.jpeg',
        alt: 'Preloader image'
    },
    {
        id: 32,
        src: '/images/Portrait.jpg',
        alt: 'Portrait image'
    }
];

export default function Landing() {
    const landingRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const addToRefs = (el: HTMLDivElement | null, index: number) => {
        if (el && !imageRefs.current[index]) {
            imageRefs.current[index] = el;
        }
    };

    useGSAP(() => {
        const container = containerRef.current;
        const landing = landingRef.current;

        if (!container || !landing) return;

        // Set initial visibility
        gsap.set(landing, {
            visibility: "visible"
        });

        // Your original entrance animations - kept exactly the same
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

        // Only add horizontal scroll if content overflows
        setTimeout(() => { // Small delay to ensure container has proper width
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

    }, { scope: landingRef });

    return (
        <section className={styles.landing} ref={landingRef}>
            <div className={styles.container} ref={containerRef}>
                {img.map((image, index) => (
                    <div
                        key={image.id}
                        className={styles.imageWrapper}
                        ref={(el) => addToRefs(el, index)}
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
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

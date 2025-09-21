"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './style.module.scss';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from '@gsap/react';
import Lenis from '@studio-freight/lenis';
import { forwardRef } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const images = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "image4.jpg",
    "image5.jpg",
    "image6.jpg",
    "image7.jpg",
    "image8.jpg",
    "image9.jpg",
    "image10.jpg",
    "image11.jpg",
    "image12.jpg"
];

interface ColumnProps {
    images: string[];
    index: number;
}

const Column = forwardRef<HTMLDivElement, ColumnProps>(
    ({ images, index }, ref) => {
        return (
            <div ref={ref} className={`${styles.column} ${styles[`column${index}`]}`}>
                {images.map((src: string, i: number) => (
                    <div key={i} className={styles.imageContainer}>
                        <Image
                            src={`/images/${src}`}
                            alt="image"
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            priority={i === 0}
                        />
                    </div>
                ))}
            </div>
        );
    }
);

Column.displayName = "Column";

export default function Landing() {
    const galleryRef = useRef<HTMLDivElement>(null);
    const [dimension, setDimension] = useState<{width: number, height: number}>({
        width: 0,
        height: 0
    });

    const column1Ref = useRef<HTMLDivElement>(null);
    const column2Ref = useRef<HTMLDivElement>(null);
    const column3Ref = useRef<HTMLDivElement>(null);
    const column4Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2
        });

        lenis.on('scroll', ScrollTrigger.update);

        const rafCallback = (time: number) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(rafCallback);
        gsap.ticker.lagSmoothing(0);

        const resize = (): void => {
            setDimension({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener("resize", resize);
        resize();

        return () => {
            window.removeEventListener("resize", resize);
            lenis.destroy();
            gsap.ticker.remove(rafCallback);
        };
    }, []);

    useGSAP(() => {
        if (!galleryRef.current || dimension.height === 0) return;

        const { height } = dimension;

        // Kill any existing ScrollTriggers for these elements
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars.trigger === galleryRef.current) {
                trigger.kill();
            }
        });

        // Column 1 - moves less (multiplier: 2)
        gsap.fromTo(column1Ref.current,
            {
                y: 0
            },
            {
                y: height * 2,
                ease: "none",
                scrollTrigger: {
                    trigger: galleryRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        );

        // Column 2 - moves more (multiplier: 3.3)
        gsap.fromTo(column2Ref.current,
            {
                y: 0
            },
            {
                y: height * 3.3,
                ease: "none",
                scrollTrigger: {
                    trigger: galleryRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        );

        // Column 3 - moves least (multiplier: 1.25)
        gsap.fromTo(column3Ref.current,
            {
                y: 0
            },
            {
                y: height * 1.25,
                ease: "none",
                scrollTrigger: {
                    trigger: galleryRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        );

        // Column 4 - moves a lot (multiplier: 3)
        gsap.fromTo(column4Ref.current,
            {
                y: 0
            },
            {
                y: height * 3,
                ease: "none",
                scrollTrigger: {
                    trigger: galleryRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        );

        ScrollTrigger.refresh();

    }, [dimension]);

    return (
        <main className={styles.main}>
            <div ref={galleryRef} className={styles.gallery}>
                <Column
                    ref={column1Ref}
                    images={[images[0], images[1], images[2]]}
                    index={1}
                />
                <Column
                    ref={column2Ref}
                    images={[images[3], images[4], images[5]]}
                    index={2}
                />
                <Column
                    ref={column3Ref}
                    images={[images[6], images[7], images[8]]}
                    index={3}
                />
                <Column
                    ref={column4Ref}
                    images={[images[9], images[10]]}
                    index={4}
                />
            </div>
            <div className={styles.spacer}></div>
        </main>
    );
}
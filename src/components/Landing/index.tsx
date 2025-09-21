"use client";

import {useRef, useState, JSX} from 'react';
import styles from './style.module.scss';
import {gsap} from 'gsap';
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {useGSAP} from '@gsap/react';
import Lenis from '@studio-freight/lenis';
import Link from 'next/link';
import Image from 'next/image';
import GridFx from './GridFx';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ImageItem {
    id: number;
    src: string;
    thumb: string;
    title: string;
    size: string;
}

const imageData: ImageItem[] = [
    {
        id: 1,
        src: 'https://picsum.photos/1280/853?random=1',
        thumb: 'https://picsum.photos/270/200?random=1',
        title: 'Assemblage',
        size: '1280x853'
    },
    {
        id: 2,
        src: 'https://picsum.photos/958/1280?random=2',
        thumb: 'https://picsum.photos/270/360?random=2',
        title: 'Demesne',
        size: '958x1280'
    },
    {
        id: 3,
        src: 'https://picsum.photos/837/1280?random=3',
        thumb: 'https://picsum.photos/270/390?random=3',
        title: 'Felicity',
        size: '837x1280'
    },
    {
        id: 4,
        src: 'https://picsum.photos/1280/961?random=4',
        thumb: 'https://picsum.photos/270/250?random=4',
        title: 'Propinquity',
        size: '1280x961'
    },
    {
        id: 5,
        src: 'https://picsum.photos/1280/1131?random=5',
        thumb: 'https://picsum.photos/270/300?random=5',
        title: 'Ephemeral',
        size: '1280x1131'
    },
    {
        id: 6,
        src: 'https://picsum.photos/1280/857?random=6',
        thumb: 'https://picsum.photos/270/230?random=6',
        title: 'Surreptitious',
        size: '1280x857'
    },
    {
        id: 7,
        src: 'https://picsum.photos/1280/1280?random=7',
        thumb: 'https://picsum.photos/270/270?random=7',
        title: 'Scintilla',
        size: '1280x1280'
    },
    {
        id: 8,
        src: 'https://picsum.photos/1280/853?random=8',
        thumb: 'https://picsum.photos/270/200?random=8',
        title: 'Vestigial',
        size: '1280x853'
    }
];


export default function Landing(): JSX.Element {

    const gridRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useGSAP(() => {
        if (!gridRef.current || !previewRef.current) return;

        // Initialize the grid effect
        const gridFx = new GridFx(gridRef.current, {
            onInit: () => {
                setIsLoaded(true);
            },
            onOpenItem: (item: HTMLElement) => {
                // Custom GSAP animations when opening
                gsap.fromTo(previewRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.4, ease: "power2.out" }
                );
            },
            onCloseItem: () => {
                // Custom GSAP animations when closing
                gsap.to(previewRef.current,
                    { opacity: 0, duration: 0.3, ease: "power2.in" }
                );
            }
        });

        return () => {
            // Cleanup if needed
            gridFx.destroy?.();
        };
    }, []);

    return (
        <div className={styles.container}>
            <div
                ref={gridRef}
                className={`${styles.grid} ${isLoaded ? styles.loaded : ''}`}
            >
                {imageData.map((item, index) => (
                    <div
                        key={item.id}
                        className={styles.gridItem}
                        data-size={item.size}
                        data-href={item.src}
                    >
                        <Link href={item.src} className={styles.imgWrap}>
                            <Image
                                src={item.thumb}
                                alt={item.title}
                                width={270}
                                height={200}
                                style={{
                                width: '100%',
                                height: 'auto',
                            }}
                                />
                            <div className={styles.description}>
                                {item.title}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            <div ref={previewRef} className={styles.preview}>
                <button className={styles.closeBtn} type="button">
                    <span>X</span>
                </button>
                <div className={styles.previewDescription}></div>
            </div>
        </div>

    );
}
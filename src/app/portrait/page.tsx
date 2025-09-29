"use client";

import styles from './style.module.scss';
import {gsap} from 'gsap';
import {useRef, useEffect } from 'react';
import {useGSAP} from '@gsap/react';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Image from 'next/link';

gsap.registerPlugin(ScrollTrigger, useGSAP, SplitText);

const PHOTO_TYPES = ['Portrait', 'Landscape', 'B&W'] as const;
type PhotoType = typeof PHOTO_TYPES[number];

interface ImageDate {
    id: string;
    url: string;
    type: PhotoType;
}

export default function Portrait() {
    return (
        <>
            <section className={styles.portraitPage}>
                <div className={styles.main}>
                    {images.map((image, index) => (
                        <div key={index} className={styles.imageWrapper}>
                            <Image src={image.url}
                                   alt={image.id}
                                   width={720}
                                   height={720}
                                   priority={image.id <= 2}
                            />
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
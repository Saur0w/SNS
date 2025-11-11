"use client";

import styles from './style.module.scss';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP);

export default function Landing() {

    const landingRef = useRef<HTMLElement>(null);

    return (
        <section className={styles.landingPage} ref={landingRef}>

        </section>
    )
}
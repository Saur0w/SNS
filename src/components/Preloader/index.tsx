"use client";

import styles from './style.module.scss';
import { gsap } from "gsap";
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP);

export default function Preloader() {
    const preloaderRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        gsap.to('.preloader', {

        });
    }, {
        scope: preloaderRef
    })
    return (
      <section className={styles.preloader} ref={preloaderRef}>

       </section>
    );
}
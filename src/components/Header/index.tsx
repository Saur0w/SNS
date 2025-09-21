"use client";

import styles from './style.module.scss';
import Link from 'next/link';
import {gsap} from "gsap";
import {useGSAP} from '@gsap/react';
import {useEffect, useRef, useState, JSX} from 'react';

gsap.registerPlugin(useGSAP);

export default function Header(): JSX.Element {
    const headerRef = useRef<HTMLElement>(null);
    const navigationRef = useRef<HTMLDivElement>(null);
    const navContentRef = useRef<HTMLDivElement>(null);
    const menuTextRef = useRef<HTMLParagraphElement>(null);
    const closeTextRef = useRef<HTMLParagraphElement>(null);

    const [isActive, setIsActive] = useState<boolean>(false);

    useGSAP(() => {
        gsap.set(navigationRef.current, { height: 0, overflow: "hidden" });
        gsap.set(closeTextRef.current, { opacity: 0 });
    }, {
        scope: headerRef
    });

    useEffect(() => {
        const tl = gsap.timeline();

        if (isActive) {
            tl.to(menuTextRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.inOut"
            })
                .to(closeTextRef.current, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.inOut"
                }, "-=0.2")
                .to(navigationRef.current, {
                    height: "50vh",
                    duration: 0.8,
                    ease: "cubic-bezier(0.76, 0, 0.24, 1)"
                }, "-=0.1")
                .from(navContentRef.current, {
                    y: -30,
                    opacity: 0,
                    duration: 0.6,
                    ease: "back.out(1.2)"
                }, "-=0.4");
        } else {
            tl.to(navContentRef.current, {
                y: -20,
                opacity: 1,
                duration: 0.4,
                ease: "power2.inOut"
            })
                .to(navigationRef.current, {
                    height: 0,
                    duration: 0.8,
                    ease: "cubic-bezier(0.76, 0, 0.24, 1)"
                }, "-=0.2")
                .to(closeTextRef.current, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.inOut"
                }, "-=0.6")
                .to(menuTextRef.current, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.inOut"
                }, "-=0.2");
        }

        return (): void => {
            tl.kill();
        };
    }, [isActive]);

    return (
        <section className={styles.header} ref={headerRef}>
            <div className={styles.bar}>
                <Link href="/">
                    SNS
                </Link>
                <div onClick={() => setIsActive(!isActive)} className={styles.el}>
                    <div className={`${styles.burger} ${isActive ? styles.burgerActive : ""}`}></div>
                    <div className={styles.label}>
                        <p ref={menuTextRef}>Menu</p>
                        <p ref={closeTextRef}>Close</p>
                    </div>
                </div>
            </div>

            <div className={styles.navigation} ref={navigationRef}>
                <div className={styles.navContent}>
                    <div className={styles.navLinks} ref={navContentRef}>
                        <Link href="/">Home</Link>
                        <Link href="/about">About</Link>
                        <Link href="/portrait">Portraits</Link>
                        <Link href="/landscape">Landscapes</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

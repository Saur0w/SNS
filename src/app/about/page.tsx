"use client";

import styles from "./style.module.scss";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import Link from "next/link";

if (typeof window !== "undefined") {
    gsap.registerPlugin(useGSAP, SplitText);
}

export default function About() {
    const containerRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const bioRef = useRef<HTMLParagraphElement>(null);

    useGSAP(() => {
        if (!titleRef.current || !bioRef.current) return;

        const titleSplit = new SplitText(titleRef.current, { type: "chars" });
        const bioSplit = new SplitText(bioRef.current, { type: "lines" });
        const bioLines = new SplitText(bioSplit.lines, { type: "lines", linesClass: styles.lineMask });

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.fromTo(titleSplit.chars,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.03, duration: 1.2 }
        )
            .fromTo(bioLines.lines,
                { yPercent: 100, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 1, stagger: 0.1 },
                "-=0.8"
            )
            .fromTo(`.${styles.meta} div`,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.1, duration: 0.8 },
                "-=0.5"
            );

        return () => {
            titleSplit.revert();
            bioSplit.revert();
            bioLines.revert();
        };
    }, { scope: containerRef });

    return (
        <section className={styles.about} ref={containerRef}>
            <Link href="/" className={styles.backBtn}>
                Close
            </Link>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 ref={titleRef}>
                        Creative Developer<br />
                        Based in India.
                    </h1>
                </div>

                <div className={styles.body}>
                    <div className={styles.bioWrapper}>
                        <p ref={bioRef} className={styles.bio}>
                            I&#39;m a Computer Science student exploring the intersection of
                            code and visual design. This archive is my personal
                            playground—a collection of perspectives captured through
                            my lens and built with the technology I love.
                            It&#39;s not just a gallery; it&#39;s a documentation of my
                            journey through college and creativity.
                        </p>
                    </div>

                    <div className={styles.meta}>
                        <div className={styles.metaGroup}>
                            <h3>Get in touch</h3>
                            <a href="mailto:sthapliyal085@gmail.com"><b>Email:</b> sthapliyal085@gmail.com</a>
                        </div>

                        <div className={styles.metaGroup}>
                            <h3>Connect</h3>
                            <a href="#" target="_blank">GitHub</a>
                            <a href="#" target="_blank">LinkedIn</a>
                            <a href="#" target="_blank">Instagram</a>
                            <a href="#" target="_blank">X</a>
                        </div>

                        <div className={styles.metaGroup}>
                            <h3>Tech Stack</h3>
                            <span>Next.js / React</span>
                            <span>GSAP Animation</span>
                            <span>Cloudinary API</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

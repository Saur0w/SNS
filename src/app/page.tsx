"use client";

import styles from "./page.module.css";
import Landing from '@/components/Landing/index';
import { ReactLenis } from "lenis/react";

export default function Home() {
  return (
    <ReactLenis>
        <div className={styles.page}>
            <Landing />
        </div>
    </ReactLenis>
  );
}

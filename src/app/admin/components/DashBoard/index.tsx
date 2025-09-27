"use client";

import styles from './style.module.scss';

export default function Dashboard() {
    return (
        <div className={styles.dashboardContent}>
            <div className={styles.header}>
                <h2>Dashboard Overview</h2>
                <p>Manage your gallery collections</p>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Total Images</h3>
                    <p className={styles.statNumber}>247</p>
                    <span className={styles.statChange}>+12 this week</span>
                </div>

                <div className={styles.statCard}>
                    <h3>Total Views</h3>
                    <p className={styles.statNumber}>12.4K</p>
                    <span className={styles.statChange}>+24% this month</span>
                </div>

                <div className={styles.statCard}>
                    <h3>Storage Used</h3>
                    <p className={styles.statNumber}>8.2GB</p>
                    <span className={styles.statChange}>of 25GB free</span>
                </div>
            </div>

            <div className={styles.quickActions}>
                <h3>Quick Actions</h3>
                <div className={styles.actionButtons}>
                    <button className={styles.primaryBtn}>📤 Bulk Upload</button>
                    <button className={styles.secondaryBtn}>🗂️ Organize Tags</button>
                    <button className={styles.secondaryBtn}>📊 View Analytics</button>
                </div>
            </div>
        </div>
    );
}

"use client";

import styles from './style.module.scss';
import { useState } from 'react';
import Portrait from './components/Portrait/index';
import Landscape from './components/Landscape/index';
import BW from './components/BW/index';
import Dashboard from './components/DashBoard/index';

type ActiveSection = 'dashboard' | 'portrait' | 'landscape' | 'bw';

export default function Admin() {
    const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'portrait', label: 'Portrait', icon: '🧑‍🎨' },
        { id: 'landscape', label: 'Landscape', icon: '🏔️' },
        { id: 'bw', label: 'B&W', icon: '⚫' }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <Dashboard />;
            case 'portrait':
                return <Portrait />;
            case 'landscape':
                return <Landscape />;
            case 'bw':
                return <BW />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <section className={styles.adminPage}>
            <div className={styles.dashboard}>
                <h1>SNS CMS</h1>
                <nav className={styles.navigation}>
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
                            onClick={() => setActiveSection(item.id as ActiveSection)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className={styles.mainContent}>
                {renderContent()}
            </div>
        </section>
    );
}

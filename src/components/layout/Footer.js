'use client';

import { useTranslations } from 'next-intl';
import styles from './Footer.module.css';

export default function Footer() {
    const t = useTranslations('footer');
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <span className={styles.logo}>🌿 sanemos.ai</span>
                        <p className={styles.tagline}>{t('tagline')}</p>
                    </div>
                </div>

                <div className={styles.crisis}>
                    <span className={styles.crisisIcon}>🚨</span>
                    <p>{t('crisis')}</p>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.rights}>{t('rights', { year })}</p>
                </div>
            </div>
        </footer>
    );
}

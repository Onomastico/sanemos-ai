'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    const t = useTranslations('footer');
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'en';
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <div className={styles.logoWrapper}>
                            <img src="/sanemos_logo_2.png" alt="sanemos.ai logo" className={styles.logoImage} />
                        </div>
                        <p className={styles.tagline}>{t('tagline')}</p>
                    </div>
                    <div className={styles.socials}>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="TikTok">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                        </a>
                    </div>
                </div>

                <div className={styles.links}>
                    <div className={styles.linksGroup}>
                        <span className={styles.linksGroupTitle}>{t('linksProject')}</span>
                        <Link href={`/${locale}/rules`} className={styles.footerLink}>{t('linkRules')}</Link>
                        <Link href={`/${locale}/terms`} className={styles.footerLink}>{t('linkTerms')}</Link>
                    </div>
                    <div className={styles.linksGroup}>
                        <span className={styles.linksGroupTitle}>{t('linksSupport')}</span>
                        <Link href={`/${locale}/donate`} className={styles.footerLinkDonate}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
                                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
                            </svg>
                            {t('linkDonate')}
                        </Link>
                        <a href="mailto:contacto@sanemos.ai" className={styles.footerLink}>{t('linkContact')}</a>
                    </div>
                </div>

                <div className={styles.crisis}>
                    <span className={styles.crisisIcon}>🚨</span>
                    <p>
                        {t('crisis')}{' '}
                        <Link href={`/${locale}/crisis`} className={styles.crisisLink}>
                            {t('crisisLink')}
                        </Link>
                    </p>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.rights}>{t('rights', { year })}</p>
                </div>
            </div>
        </footer>
    );
}

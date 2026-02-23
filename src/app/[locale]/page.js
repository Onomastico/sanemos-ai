'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LandingPage() {
    const t = useTranslations('landing');
    const tNav = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    return (
        <div className={styles.landing}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.gradientOrb1} />
                    <div className={styles.gradientOrb2} />
                    <div className={styles.gradientOrb3} />
                </div>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
                    <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
                    <div className={styles.heroCta}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => router.push(`/${locale}/auth/register`)}
                        >
                            {t('ctaStart')}
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={() => {
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            {t('ctaLearn')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={styles.features}>
                <div className={styles.container}>
                    <div className={styles.featureGrid}>
                        <div className={`${styles.featureCard} animate-fade-in-up`} style={{ animationDelay: '0.1s' }}>
                            <div className={styles.featureIcon}>💬</div>
                            <h3>{t('featureChat')}</h3>
                            <p>{t('featureChatDesc')}</p>
                        </div>
                        <div className={`${styles.featureCard} animate-fade-in-up`} style={{ animationDelay: '0.2s' }}>
                            <div className={styles.featureIcon}>📚</div>
                            <h3>{t('featureResources')}</h3>
                            <p>{t('featureResourcesDesc')}</p>
                        </div>
                        <div className={`${styles.featureCard} animate-fade-in-up`} style={{ animationDelay: '0.3s' }}>
                            <div className={styles.featureIcon}>🩺</div>
                            <h3>{t('featureTherapists')}</h3>
                            <p>{t('featureTherapistsDesc')}</p>
                        </div>
                        <div className={`${styles.featureCard} animate-fade-in-up`} style={{ animationDelay: '0.4s' }}>
                            <div className={styles.featureIcon}>🤝</div>
                            <h3>{t('featureCommunity')}</h3>
                            <p>{t('featureCommunityDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section className={styles.aboutUs}>
                <div className={styles.container}>
                    <div className={`${styles.aboutUsContent} animate-fade-in-up`}>
                        <h2 className={styles.aboutUsTitle}>{t('aboutUsTitle')}</h2>
                        <p className={styles.aboutUsDesc}>{t('aboutUsDesc')}</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.container}>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>0</span>
                            <span className={styles.statLabel}>{t('statsUsers')}</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>0</span>
                            <span className={styles.statLabel}>{t('statsResources')}</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNumber}>0</span>
                            <span className={styles.statLabel}>{t('statsTherapists')}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

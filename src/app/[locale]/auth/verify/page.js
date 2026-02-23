'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from '../auth.module.css';

function VerifyContent() {
    const t = useTranslations('auth');
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = pathname.split('/')[1] || 'en';
    const email = searchParams.get('email') || '';

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authIcon}>✉️</span>
                    <h1>{t('verifyTitle')}</h1>
                    <p>{t('verifyMessage', { email })}</p>
                </div>

                <div className={styles.authFooter}>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => router.push(`/${locale}/auth/login`)}
                        style={{ width: '100%' }}
                    >
                        {t('verifyBack')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense>
            <VerifyContent />
        </Suspense>
    );
}

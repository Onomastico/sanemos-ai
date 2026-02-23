'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../auth.module.css';

export default function LoginPage() {
    const t = useTranslations('auth');
    const tNav = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) return setError(t('emailRequired'));
        if (!password) return setError(t('passwordRequired'));

        setLoading(true);
        const supabase = createClient();

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(t('invalidCredentials'));
            setLoading(false);
            return;
        }

        router.push(`/${locale}/dashboard`);
        router.refresh();
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authIcon}>🌿</span>
                    <h1>{t('loginTitle')}</h1>
                    <p>{t('loginSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.authError}>{error}</div>}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">{t('email')}</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">{t('password')}</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '...' : t('loginButton')}
                    </button>
                </form>

                <div className={styles.authFooter}>
                    <p>
                        {t('noAccount')}{' '}
                        <button className={styles.authLink} onClick={() => router.push(`/${locale}/auth/register`)}>
                            {tNav('register')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

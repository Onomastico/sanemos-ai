'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../auth.module.css';

export default function RegisterPage() {
    const t = useTranslations('auth');
    const tNav = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!displayName) return setError(t('nameRequired'));
        if (!email) return setError(t('emailRequired'));
        if (!password) return setError(t('passwordRequired'));
        if (password.length < 6) return setError(t('passwordMinLength'));
        if (password !== confirmPassword) return setError(t('passwordMismatch'));

        setLoading(true);
        const supabase = createClient();

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    locale: locale,
                },
                emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
            },
        });

        if (authError) {
            setError(t('genericError'));
            setLoading(false);
            return;
        }

        router.push(`/${locale}/auth/verify?email=${encodeURIComponent(email)}`);
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authIcon}>🌱</span>
                    <h1>{t('registerTitle')}</h1>
                    <p>{t('registerSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.authError}>{error}</div>}

                    <div className="form-group">
                        <label className="form-label" htmlFor="displayName">{t('displayName')}</label>
                        <input
                            id="displayName"
                            type="text"
                            className="form-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Luna"
                            autoComplete="name"
                        />
                    </div>

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
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">{t('confirmPassword')}</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '...' : t('registerButton')}
                    </button>
                </form>

                <div className={styles.authFooter}>
                    <p>
                        {t('hasAccount')}{' '}
                        <button className={styles.authLink} onClick={() => router.push(`/${locale}/auth/login`)}>
                            {tNav('login')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

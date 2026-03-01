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
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isMinor, setIsMinor] = useState(false);
    const [parentalAwareness, setParentalAwareness] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lossType, setLossType] = useState('');
    const [worldview, setWorldview] = useState('');

    const es = locale === 'es';
    const LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
    const WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];
    const lossLabels = {
        parent: es ? 'Padre/madre' : 'Parent', child: es ? 'Hijo/a' : 'Child',
        partner: es ? 'Pareja' : 'Partner', sibling: es ? 'Hermano/a' : 'Sibling',
        friend: es ? 'Amigo/a' : 'Friend', pet: es ? 'Mascota' : 'Pet',
        other: es ? 'Otro' : 'Other', general: 'General',
    };
    const worldviewLabels = {
        secular: 'Secular', spiritual: es ? 'Espiritual' : 'Spiritual',
        christian: es ? 'Cristiano' : 'Christian', jewish: es ? 'Judío' : 'Jewish',
        muslim: es ? 'Musulmán' : 'Muslim', buddhist: es ? 'Budista' : 'Buddhist',
        hindu: es ? 'Hindú' : 'Hindu', universal: 'Universal',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!displayName) return setError(t('nameRequired'));
        if (!email) return setError(t('emailRequired'));
        if (!password) return setError(t('passwordRequired'));
        if (password.length < 6) return setError(t('passwordMinLength'));
        if (password !== confirmPassword) return setError(t('passwordMismatch'));
        if (!termsAccepted) return setError(t('termsRequired'));
        if (isMinor && !parentalAwareness) return setError(
            es
                ? 'Debes confirmar que tu representante legal está al tanto de tu registro.'
                : 'You must confirm your legal guardian is aware of your registration.'
        );

        setLoading(true);
        const supabase = createClient();

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    locale: locale,
                    ...(lossType && { loss_type: lossType }),
                    ...(worldview && { worldview }),
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/${locale}/auth/callback`,
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

                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        padding: '0.75rem',
                        background: 'var(--surface-alt, var(--surface))',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <input
                            id="termsAccepted"
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            style={{ marginTop: '2px', flexShrink: 0, accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="termsAccepted" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: '1.5', cursor: 'pointer' }}>
                            {locale === 'es' ? (
                                <>
                                    He leído y acepto los{' '}
                                    <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                        Términos y Condiciones
                                    </a>
                                    {' '}y las{' '}
                                    <a href={`/${locale}/rules`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                        Normas de la Comunidad
                                    </a>
                                    {' '}de sanemos.ai. Declaro tener al menos 16 años.
                                </>
                            ) : (
                                <>
                                    I have read and agree to the{' '}
                                    <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                        Terms and Conditions
                                    </a>
                                    {' '}and the{' '}
                                    <a href={`/${locale}/rules`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                        Community Guidelines
                                    </a>
                                    {' '}of sanemos.ai. I confirm I am at least 16 years old.
                                </>
                            )}
                        </label>
                    </div>

                    {/* Minor declaration (16-17 year olds) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        padding: '0.75rem',
                        background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--surface-alt, var(--surface)))',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <input
                            id="isMinor"
                            type="checkbox"
                            checked={isMinor}
                            onChange={e => { setIsMinor(e.target.checked); if (!e.target.checked) setParentalAwareness(false); }}
                            style={{ marginTop: '2px', flexShrink: 0, accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="isMinor" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: '1.5', cursor: 'pointer' }}>
                            {es
                                ? 'Tengo entre 16 y 17 años (marca esta casilla si aplica)'
                                : 'I am between 16 and 17 years old (check this box if applicable)'}
                        </label>
                    </div>

                    {isMinor && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.625rem',
                            padding: '0.75rem',
                            background: 'color-mix(in srgb, var(--accent-primary) 8%, var(--surface-alt, var(--surface)))',
                            border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <input
                                id="parentalAwareness"
                                type="checkbox"
                                checked={parentalAwareness}
                                onChange={e => setParentalAwareness(e.target.checked)}
                                required={isMinor}
                                style={{ marginTop: '2px', flexShrink: 0, accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="parentalAwareness" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: '1.5', cursor: 'pointer' }}>
                                {es
                                    ? 'Confirmo que mi representante legal tiene conocimiento de mi registro en sanemos.ai y, donde la ley lo requiera, ha otorgado su consentimiento.'
                                    : 'I confirm that my legal guardian is aware of my registration on sanemos.ai and, where required by law, has given their consent.'}
                            </label>
                        </div>
                    )}

                    {/* Optional personalization */}
                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--surface-alt, var(--surface))',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem',
                    }}>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: 0 }}>
                            {es ? '✨ Opcional: personaliza tu experiencia de duelo' : '✨ Optional: personalize your grief experience'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <select className="form-input" value={lossType} onChange={e => setLossType(e.target.value)} style={{ fontSize: 'var(--font-size-sm)' }}>
                                <option value="">{es ? 'Tipo de pérdida' : 'Type of loss'}</option>
                                {LOSS_TYPES.map(k => <option key={k} value={k}>{lossLabels[k]}</option>)}
                            </select>
                            <select className="form-input" value={worldview} onChange={e => setWorldview(e.target.value)} style={{ fontSize: 'var(--font-size-sm)' }}>
                                <option value="">{es ? 'Cosmovisión' : 'Worldview'}</option>
                                {WORLDVIEWS.map(k => <option key={k} value={k}>{worldviewLabels[k]}</option>)}
                            </select>
                        </div>
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

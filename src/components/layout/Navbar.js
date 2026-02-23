'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePresence } from '@/hooks/usePresence';
import styles from './Navbar.module.css';

export default function Navbar() {
    const t = useTranslations('nav');
    const tCommon = useTranslations('common');
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isStaff, setIsStaff] = useState(false);
    const [profile, setProfile] = useState(null);

    const locale = pathname.split('/')[1] || 'en';
    const otherLocale = locale === 'en' ? 'es' : 'en';

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(async ({ data: { user } }) => {
            setUser(user);
            setLoading(false);
            if (user) {
                fetch('/api/admin/check').then(r => r.json()).then(d => setIsStaff(d.isStaff));
                const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(userProfile || { id: user.id, email: user.email });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const { onlineCount } = usePresence(profile);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push(`/${locale}`);
        router.refresh();
    };

    const switchLocale = () => {
        const segments = pathname.split('/');
        segments[1] = otherLocale;
        router.push(segments.join('/'));
    };

    const navigateTo = (path) => {
        router.push(`/${locale}${path}`);
        setMenuOpen(false);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <button className={styles.logo} onClick={() => navigateTo('/')}>
                    <span className={styles.logoIcon}>🌿</span>
                    <span className={styles.logoText}>{tCommon('appName')}</span>
                </button>

                <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
                    <button className={styles.navLink} onClick={() => navigateTo('/')}>
                        {t('home')}
                    </button>
                    <button className={styles.navLink} onClick={() => navigateTo('/resources')}>
                        {t('resources')}
                    </button>
                    <button className={styles.navLink} onClick={() => navigateTo('/therapists')}>
                        {t('therapists')}
                    </button>

                    <div className={styles.navDivider} />

                    {!loading && (
                        <>
                            {user ? (
                                <>
                                    <button className={styles.navLink} onClick={() => navigateTo('/chat')}>
                                        {t('chat')}
                                    </button>
                                    <button className={styles.navLink} onClick={() => navigateTo('/companions')}>
                                        {t('companions')}
                                    </button>
                                    <button className={styles.navLink} onClick={() => navigateTo('/dashboard')}>
                                        {t('dashboard')}
                                    </button>
                                    <button className={styles.navLink} onClick={() => navigateTo('/profile')}>
                                        {t('profile')}
                                    </button>
                                    {isStaff && (
                                        <button className={styles.navLink} onClick={() => navigateTo('/admin')}>
                                            🛡️ {t('admin')}
                                        </button>
                                    )}
                                    <button className={`${styles.navLink} ${styles.logoutLink}`} onClick={handleLogout}>
                                        {t('logout')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className={styles.navLink} onClick={() => navigateTo('/auth/login')}>
                                        {t('login')}
                                    </button>
                                    <button className={`btn btn-primary btn-sm`} onClick={() => navigateTo('/auth/register')}>
                                        {t('register')}
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    <div className={styles.onlineBadge} title={tCommon('onlineUsers') || 'Online Users'}>
                        <span className={styles.onlineDot}></span>
                        <span>{onlineCount} online</span>
                    </div>

                    <button className={styles.langToggle} onClick={switchLocale} title="Switch language">
                        {otherLocale.toUpperCase()}
                    </button>
                </div>

                <button
                    className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>
        </nav>
    );
}

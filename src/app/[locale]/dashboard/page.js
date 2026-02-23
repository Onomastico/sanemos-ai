'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const t = useTranslations('nav');
    const tRes = useTranslations('resources');
    const tCommon = useTranslations('common');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [myResources, setMyResources] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push(`/${locale}/auth/login`);
                return;
            }

            setUser(user);

            // Get profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);

            // Get user's resources
            const { data: resourcesData } = await supabase
                .from('resources')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setMyResources(resourcesData || []);

            // Fetch conversations
            const res = await fetch('/api/chat/conversations');
            if (res.ok) {
                const data = await res.json();
                setRecentChats(data.conversations || []);
            }

            setLoading(false);
        };

        init();
    }, [locale, router]);

    if (loading) {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.container}>
                    <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    const displayName = profile?.display_name || user.user_metadata?.display_name || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

    // Filter chats
    const aiChats = recentChats.filter(c => c.type === 'ai').slice(0, 3); // top 3
    const humanChats = recentChats.filter(c => c.type !== 'ai').slice(0, 3); // top 3

    const agentEmojis = {
        luna: '🫂', marco: '🧭', serena: '🧘', alma: '📖', faro: '🚨'
    };

    return (
        <div className={styles.dashboardPage}>
            <div className={styles.container}>
                {/* Welcome Card */}
                <div className={styles.welcomeCard}>
                    <div className={styles.welcomeLeft}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="avatar avatar-lg" style={{ objectFit: 'cover' }} />
                        ) : (
                            <div className="avatar avatar-lg">{initials}</div>
                        )}
                        <div>
                            <h1 className={styles.welcomeTitle}>
                                {locale === 'es' ? `Hola, ${displayName}` : `Hello, ${displayName}`}
                            </h1>
                            <p className={styles.welcomeSubtitle}>{tCommon('tagline')}</p>
                        </div>
                    </div>
                    {profile?.role && profile.role !== 'user' && (
                        <span className="badge badge-primary">{profile.role}</span>
                    )}
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/resources`)}
                    >
                        <span className={styles.actionIcon}>📚</span>
                        <span className={styles.actionLabel}>{t('resources')}</span>
                    </button>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/resources/new`)}
                    >
                        <span className={styles.actionIcon}>✨</span>
                        <span className={styles.actionLabel}>{tRes('addNew')}</span>
                    </button>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/chat`)}
                    >
                        <span className={styles.actionIcon}>💬</span>
                        <span className={styles.actionLabel}>{t('chat')}</span>
                    </button>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/therapists`)}
                    >
                        <span className={styles.actionIcon}>🩺</span>
                        <span className={styles.actionLabel}>{t('therapists')}</span>
                    </button>
                </div>

                {/* My Resources */}
                {myResources.length > 0 && (
                    <div className={styles.section} style={{ marginBottom: 'var(--space-xl)' }}>
                        <h2 className={styles.sectionTitle}>
                            {locale === 'es' ? 'Mis recursos compartidos' : 'My shared resources'}
                        </h2>
                        <div className={styles.resourceList}>
                            {myResources.map((resource) => (
                                <button
                                    key={resource.id}
                                    className={styles.resourceItem}
                                    onClick={() => router.push(`/${locale}/resources/${resource.id}`)}
                                    style={{ width: '100%', textAlign: 'left' }}
                                >
                                    <span className={styles.resourceEmoji}>
                                        {resource.type === 'book' ? '📖' :
                                            resource.type === 'series' ? '📺' :
                                                resource.type === 'movie' ? '🎬' :
                                                    resource.type === 'comic' ? '🦸' : '📕'}
                                    </span>
                                    <div>
                                        <p className={styles.resourceTitle}>{resource.title}</p>
                                        <span className="badge badge-primary">{tRes(`types.${resource.type}`)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Chats */}
                {aiChats.length > 0 && (
                    <div className={styles.section} style={{ marginBottom: 'var(--space-xl)' }}>
                        <h2 className={styles.sectionTitle}>
                            🤖 {locale === 'es' ? 'Compañeros de IA' : 'AI Companions'}
                        </h2>
                        <div className={styles.resourceList}>
                            {aiChats.map((conv) => (
                                <button
                                    key={conv.id}
                                    className={styles.resourceItem}
                                    onClick={() => router.push(`/${locale}/chat/${conv.id}`)}
                                    style={{ width: '100%', textAlign: 'left', justifyContent: 'space-between' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <span className={styles.resourceEmoji}>
                                            {agentEmojis[conv.ai_agent_type] || '🤖'}
                                        </span>
                                        <div>
                                            <p className={styles.resourceTitle}>{conv.title}</p>
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                                {new Date(conv.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 'var(--font-size-sm)' }}>➔</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Human Chats */}
                {humanChats.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            👥 {locale === 'es' ? 'Conversaciones Comunitarias' : 'Community Chats'}
                        </h2>
                        <div className={styles.resourceList}>
                            {humanChats.map((conv) => (
                                <button
                                    key={conv.id}
                                    className={styles.resourceItem}
                                    onClick={() => router.push(`/${locale}/chat/${conv.id}`)}
                                    style={{ width: '100%', textAlign: 'left', justifyContent: 'space-between' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <span className={styles.resourceEmoji}>👥</span>
                                        <div>
                                            <p className={styles.resourceTitle}>{conv.title}</p>
                                            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                                                {conv.visibility === 'public' && <span className="badge badge-primary">🌐</span>}
                                                {conv.visibility === 'shared' && <span className="badge badge-sage">🤝</span>}
                                                {conv.loss_type && <span className="badge badge-warm">{conv.loss_type}</span>}
                                                {conv.worldview && <span className="badge badge-calm">{conv.worldview}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 'var(--font-size-sm)' }}>➔</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

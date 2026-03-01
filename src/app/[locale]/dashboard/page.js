'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
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
    const [activeShift, setActiveShift] = useState(null);
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [dailyLetter, setDailyLetter] = useState(null);

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

            // Fetch random letter for Letter of the Day
            try {
                const letterRes = await fetch('/api/letters/random');
                if (letterRes.ok) {
                    const letterData = await letterRes.json();
                    if (letterData.letter) setDailyLetter(letterData.letter);
                }
            } catch { /* no letter available */ }

            // Check for active/upcoming volunteer shifts today
            try {
                const shiftsRes = await fetch('/api/volunteers/my-shifts');
                if (shiftsRes.ok) {
                    const shiftsData = await shiftsRes.json();
                    const now = new Date();
                    const todayShift = (shiftsData.shifts || []).find(s => {
                        const start = new Date(s.start_time);
                        const end = new Date(s.end_time);
                        // Show banner from 30 min before start until end
                        return now >= new Date(start.getTime() - 30 * 60 * 1000) && now <= end;
                    });
                    if (todayShift) setActiveShift(todayShift);
                }
            } catch { /* not a volunteer */ }

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

    const es = locale === 'es';
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

    return (
        <div className={styles.dashboardPage}>
            <div className={styles.container}>
                {/* Letter of the Day */}
                {dailyLetter && (
                    <div className={styles.letterCard}>
                        <div className={styles.letterCardHeader}>
                            <span>💌</span>
                            <span className={styles.letterCardLabel}>{es ? 'Una carta para ti' : 'A letter for you'}</span>
                        </div>
                        <p className={styles.letterCardExcerpt}>
                            "{dailyLetter.content.replace(/<[^>]*>/g, '').slice(0, 250)}..."
                        </p>
                        <div className={styles.letterCardFooter}>
                            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                                {dailyLetter.loss_type && <span className={styles.letterTag}>{lossLabels[dailyLetter.loss_type] || dailyLetter.loss_type}</span>}
                                {dailyLetter.worldview && <span className={styles.letterTag}>{worldviewLabels[dailyLetter.worldview] || dailyLetter.worldview}</span>}
                            </div>
                            <Link href={`/${locale}/letters/${dailyLetter.id}`} className="btn btn-secondary btn-sm">
                                {es ? 'Leer carta completa →' : 'Read full letter →'}
                            </Link>
                        </div>
                    </div>
                )}

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

                {/* Volunteer Shift Banner */}
                {activeShift && (() => {
                    const checkin = activeShift.volunteer_checkins?.[0];
                    const now = new Date();
                    const start = new Date(activeShift.start_time);
                    const end = new Date(activeShift.end_time);
                    const isActive = now >= start && now <= end;
                    const es = locale === 'es';

                    const handleCheckin = async () => {
                        setCheckinLoading(true);
                        await fetch(`/api/volunteers/shifts/${activeShift.confirmation_token}/checkin`, { method: 'POST' });
                        setActiveShift(prev => ({
                            ...prev,
                            volunteer_checkins: [{ checked_in_at: new Date().toISOString(), checked_out_at: null }],
                        }));
                        setCheckinLoading(false);
                    };

                    const handleCheckout = async () => {
                        setCheckinLoading(true);
                        await fetch(`/api/volunteers/shifts/${activeShift.confirmation_token}/checkout`, { method: 'POST' });
                        setActiveShift(null);
                        setCheckinLoading(false);
                    };

                    return (
                        <div style={{
                            background: checkin ? 'rgba(0,229,184,0.1)' : 'rgba(51,149,255,0.1)',
                            border: `1px solid ${checkin ? 'var(--accent-calm)' : 'var(--accent-primary)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-md) var(--space-lg)',
                            marginBottom: 'var(--space-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 'var(--space-md)',
                            flexWrap: 'wrap',
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                                    {checkin ? `🟢 ${es ? 'Turno activo' : 'Active shift'}` : `📅 ${es ? 'Tu turno comienza pronto' : 'Your shift starts soon'}`}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                    {start.toLocaleTimeString(es ? 'es-CL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    {' – '}
                                    {end.toLocaleTimeString(es ? 'es-CL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    {activeShift.notes && ` · ${activeShift.notes}`}
                                </div>
                            </div>
                            {checkin ? (
                                <button className="btn btn-secondary btn-sm" onClick={handleCheckout} disabled={checkinLoading}>
                                    {checkinLoading ? '...' : (es ? 'Finalizar turno' : 'End shift')}
                                </button>
                            ) : isActive ? (
                                <button className="btn btn-primary btn-sm" onClick={handleCheckin} disabled={checkinLoading}>
                                    {checkinLoading ? '...' : (es ? '✓ Iniciar turno' : '✓ Start shift')}
                                </button>
                            ) : (
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                    {es ? 'El turno aún no ha comenzado' : 'Shift hasn\'t started yet'}
                                </span>
                            )}
                        </div>
                    );
                })()}

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/letters`)}
                    >
                        <span className={styles.actionIcon}>💌</span>
                        <span className={styles.actionLabel}>{t('letters')}</span>
                    </button>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/journal`)}
                    >
                        <span className={styles.actionIcon}>📔</span>
                        <span className={styles.actionLabel}>{t('journal')}</span>
                    </button>
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
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/therapists/new`)}
                    >
                        <span className={styles.actionIcon}>🩺✨</span>
                        <span className={styles.actionLabel}>{locale === 'es' ? 'Añadir Terapeuta' : 'Add Therapist'}</span>
                    </button>
                    <button
                        className={styles.actionCard}
                        onClick={() => router.push(`/${locale}/profile`)}
                    >
                        <span className={styles.actionIcon}>👤</span>
                        <span className={styles.actionLabel}>{locale === 'es' ? 'Mi Perfil' : 'My Profile'}</span>
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

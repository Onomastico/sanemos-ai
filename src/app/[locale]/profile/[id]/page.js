'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../profile.module.css';

export default function PublicProfilePage() {
    const t = useTranslations('profile');
    const tRes = useTranslations('resources');
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const locale = pathname.split('/')[1] || 'en';
    const profileId = params.id;

    const [profile, setProfile] = useState(null);
    const [losses, setLosses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user?.id === profileId) {
                setIsOwnProfile(true);
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            setProfile(profileData);

            // Load losses only if profile is public or own profile
            if (profileData?.is_profile_public || user?.id === profileId) {
                const { data: lossesData } = await supabase
                    .from('user_losses')
                    .select('*')
                    .eq('user_id', profileId)
                    .order('created_at', { ascending: false });

                setLosses(lossesData || []);
            }

            setLoading(false);
        };

        init();
    }, [profileId]);

    if (loading) {
        return (
            <div className={styles.publicPage}>
                <div className={styles.publicContainer}>
                    <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={styles.publicPage}>
                <div className={styles.publicContainer}>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-3xl)' }}>
                        {t('profileNotFound')}
                    </p>
                </div>
            </div>
        );
    }

    // Check privacy
    if (!profile.is_profile_public && !isOwnProfile) {
        return (
            <div className={styles.publicPage}>
                <div className={styles.publicContainer}>
                    <div className={styles.privateMessage}>
                        <span>🔒</span>
                        <h2>{t('privateProfile')}</h2>
                        <p>{t('privateProfileMessage')}</p>
                    </div>
                </div>
            </div>
        );
    }

    const displayName = profile.display_name || 'User';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div className={styles.publicPage}>
            <div className={styles.publicContainer}>
                {isOwnProfile && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => router.push(`/${locale}/profile`)}
                        style={{ marginBottom: 'var(--space-md)' }}
                    >
                        ← {t('editProfile')}
                    </button>
                )}

                <div className={styles.publicCard}>
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className={styles.publicAvatarLarge} />
                    ) : (
                        <div className={styles.publicAvatarPlaceholder}>{initial}</div>
                    )}

                    <h1 className={styles.publicName}>{displayName}</h1>
                    {profile.nickname && (
                        <p className={styles.publicNickname}>@{profile.nickname}</p>
                    )}

                    {profile.current_loss_type && (
                        <div className={styles.publicCurrentLoss}>
                            <span>{t('currentlyExperiencing')}</span>
                            <span className="badge badge-warm">
                                {tRes(`lossTypes.${profile.current_loss_type}`)}
                            </span>
                        </div>
                    )}

                    {/* Loss History */}
                    {losses.length > 0 && (
                        <div className={styles.publicLossHistory}>
                            <h3>{t('lossHistory')}</h3>
                            <div className={styles.lossList}>
                                {losses.map((loss) => (
                                    <div key={loss.id} className={`${styles.lossItem} ${loss.status === 'resolved' ? styles.lossResolved : ''}`}>
                                        <div className={styles.lossInfo}>
                                            <div className={styles.lossHeader}>
                                                <span className={`badge ${loss.status === 'active' ? 'badge-warm' : 'badge-calm'}`}>
                                                    {tRes(`lossTypes.${loss.loss_type}`)}
                                                </span>
                                                <span className={`badge ${loss.status === 'active' ? 'badge-alert' : 'badge-calm'}`}>
                                                    {t(`status_${loss.status}`)}
                                                </span>
                                            </div>
                                            {loss.description && (
                                                <p className={styles.lossDescription}>{loss.description}</p>
                                            )}
                                            {loss.loss_date && (
                                                <span className={styles.lossDate}>
                                                    {new Date(loss.loss_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

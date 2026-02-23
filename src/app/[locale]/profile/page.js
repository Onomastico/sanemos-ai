'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './profile.module.css';

export default function ProfilePage() {
    const t = useTranslations('profile');
    const tRes = useTranslations('resources');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [losses, setLosses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [nickname, setNickname] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [currentLossType, setCurrentLossType] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // New loss form
    const [showLossForm, setShowLossForm] = useState(false);
    const [newLossType, setNewLossType] = useState('');
    const [newLossDescription, setNewLossDescription] = useState('');
    const [newLossDate, setNewLossDate] = useState('');

    const lossTypes = ['parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'other'];

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadProfile = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push(`/${locale}/auth/login`);
            return;
        }

        setUser(user);

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileData) {
            setProfile(profileData);
            setDisplayName(profileData.display_name || '');
            setNickname(profileData.nickname || '');
            setIsPublic(profileData.is_profile_public || false);
            setCurrentLossType(profileData.current_loss_type || '');
            setAvatarPreview(profileData.avatar_url || null);
        }

        const { data: lossesData } = await supabase
            .from('user_losses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setLosses(lossesData || []);
        setLoading(false);
    }, [locale, router]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast(t('avatarTooLarge'), 'error');
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);

        const supabase = createClient();
        let avatarUrl = profile?.avatar_url;

        // Upload avatar if changed
        if (avatarFile) {
            const formData = new FormData();
            formData.append('avatar', avatarFile);

            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                avatarUrl = data.url;
            } else {
                showToast(t('avatarUploadError'), 'error');
                setSaving(false);
                return;
            }
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                nickname: nickname || null,
                is_profile_public: isPublic,
                current_loss_type: currentLossType || null,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (error) {
            showToast(t('saveError'), 'error');
        } else {
            showToast(t('saveSuccess'));
            setAvatarFile(null);
            await loadProfile();
        }

        setSaving(false);
    };

    const handleAddLoss = async (e) => {
        e.preventDefault();
        if (!newLossType) return;

        const supabase = createClient();
        const { error } = await supabase.from('user_losses').insert({
            user_id: user.id,
            loss_type: newLossType,
            description: newLossDescription || null,
            loss_date: newLossDate || null,
            status: 'active',
        });

        if (!error) {
            showToast(t('lossAdded'));
            setNewLossType('');
            setNewLossDescription('');
            setNewLossDate('');
            setShowLossForm(false);
            await loadProfile();
        }
    };

    const handleToggleLossStatus = async (lossId, currentStatus) => {
        const supabase = createClient();
        const newStatus = currentStatus === 'active' ? 'resolved' : 'active';
        await supabase.from('user_losses').update({
            status: newStatus,
            resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
        }).eq('id', lossId);
        await loadProfile();
    };

    const handleDeleteLoss = async (lossId) => {
        const supabase = createClient();
        await supabase.from('user_losses').delete().eq('id', lossId);
        showToast(t('lossDeleted'));
        await loadProfile();
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>{t('title')}</h1>
                <p className={styles.pageSubtitle}>{t('subtitle')}</p>

                {/* Profile Settings Card */}
                <form onSubmit={handleSaveProfile} className={styles.card}>
                    <h2 className={styles.sectionTitle}>{t('personalInfo')}</h2>

                    {/* Avatar Section */}
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className={styles.avatarImage} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            )}
                            <label className={styles.avatarUploadBtn}>
                                📷
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleAvatarChange}
                                    hidden
                                />
                            </label>
                        </div>
                        <p className={styles.avatarHint}>{t('avatarHint')}</p>
                    </div>

                    {/* Display Name */}
                    <div className="form-group">
                        <label className="form-label">{t('displayName')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Nickname */}
                    <div className="form-group">
                        <label className="form-label">{t('nickname')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value.slice(0, 30))}
                            placeholder={t('nicknamePlaceholder')}
                            maxLength={30}
                        />
                        <span className={styles.charCount}>{nickname.length}/30</span>
                    </div>

                    {/* Current Loss Type */}
                    <div className="form-group">
                        <label className="form-label">{t('currentLossType')}</label>
                        <select
                            className="form-input form-select"
                            value={currentLossType}
                            onChange={(e) => setCurrentLossType(e.target.value)}
                        >
                            <option value="">{t('noCurrentLoss')}</option>
                            {lossTypes.map((lt) => (
                                <option key={lt} value={lt}>{tRes(`lossTypes.${lt}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Public Profile Toggle */}
                    <div className={styles.toggleRow}>
                        <div>
                            <span className={styles.toggleLabel}>{t('publicProfile')}</span>
                            <p className={styles.toggleHint}>{t('publicProfileHint')}</p>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                            <span className={styles.toggleSlider} />
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? '...' : t('saveProfile')}
                    </button>
                </form>

                {/* Loss History Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.sectionTitle}>{t('lossHistory')}</h2>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowLossForm(!showLossForm)}
                        >
                            {showLossForm ? t('cancelAdd') : `+ ${t('addLoss')}`}
                        </button>
                    </div>
                    <p className={styles.sectionHint}>{t('lossHistoryHint')}</p>

                    {/* Add Loss Form */}
                    {showLossForm && (
                        <form onSubmit={handleAddLoss} className={styles.lossForm}>
                            <div className="form-group">
                                <label className="form-label">{t('lossType')}</label>
                                <select
                                    className="form-input form-select"
                                    value={newLossType}
                                    onChange={(e) => setNewLossType(e.target.value)}
                                    required
                                >
                                    <option value="">{t('selectLossType')}</option>
                                    {lossTypes.map((lt) => (
                                        <option key={lt} value={lt}>{tRes(`lossTypes.${lt}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('lossDescription')}</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={newLossDescription}
                                    onChange={(e) => setNewLossDescription(e.target.value)}
                                    placeholder={t('lossDescriptionPlaceholder')}
                                    rows={2}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('lossDate')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={newLossDate}
                                    onChange={(e) => setNewLossDate(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm">
                                {t('saveLoss')}
                            </button>
                        </form>
                    )}

                    {/* Loss List */}
                    {losses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>🕊</span>
                            <p>{t('noLosses')}</p>
                        </div>
                    ) : (
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
                                    <div className={styles.lossActions}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleToggleLossStatus(loss.id, loss.status)}
                                            title={loss.status === 'active' ? t('markResolved') : t('markActive')}
                                        >
                                            {loss.status === 'active' ? '✓' : '↩'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleDeleteLoss(loss.id)}
                                            title={t('deleteLoss')}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Public Profile Link */}
                {isPublic && (
                    <div className={styles.publicLink}>
                        <p>{t('publicLinkLabel')}</p>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => router.push(`/${locale}/profile/${user.id}`)}
                        >
                            {t('viewPublicProfile')} →
                        </button>
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

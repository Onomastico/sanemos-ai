'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './therapists.module.css';

export default function TherapistsPage() {
    const t = useTranslations('therapists');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modality, setModality] = useState('');
    const [specialization, setSpecialization] = useState('');

    const specializations = [
        'grief_counseling', 'trauma', 'cbt', 'emdr', 'group_therapy',
        'child_loss', 'partner_loss', 'suicide_loss', 'pet_loss',
        'complicated_grief', 'family_therapy',
    ];

    const fetchTherapists = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();

        let query = supabase
            .from('therapists')
            .select('*')
            .eq('is_active', true)
            .order('is_verified', { ascending: false })
            .order('avg_rating', { ascending: false });

        if (modality) {
            query = query.or(`modality.eq.${modality},modality.eq.both`);
        }

        if (specialization) {
            query = query.contains('specializations', [specialization]);
        }

        const { data, error } = await query;

        if (!error && data) {
            let filtered = data;
            if (search) {
                const q = search.toLowerCase();
                filtered = data.filter(t =>
                    t.full_name?.toLowerCase().includes(q) ||
                    t.bio?.toLowerCase().includes(q) ||
                    t.city?.toLowerCase().includes(q) ||
                    t.country?.toLowerCase().includes(q)
                );
            }
            setTherapists(filtered);
        }
        setLoading(false);
    }, [search, modality, specialization]);

    useEffect(() => {
        fetchTherapists();
    }, [fetchTherapists]);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>{t('title')}</h1>
                        <p className={styles.subtitle}>{t('subtitle')}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            className={`form-input ${styles.searchInput}`}
                            placeholder={t('searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className={`form-input form-select ${styles.filterSelect}`}
                        value={modality}
                        onChange={(e) => setModality(e.target.value)}
                    >
                        <option value="">{t('allModalities')}</option>
                        <option value="in_person">{t('modalities.in_person')}</option>
                        <option value="online">{t('modalities.online')}</option>
                        <option value="both">{t('modalities.both')}</option>
                    </select>

                    <select
                        className={`form-input form-select ${styles.filterSelect}`}
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                    >
                        <option value="">{t('allSpecializations')}</option>
                        {specializations.map((s) => (
                            <option key={s} value={s}>{t(`specializations.${s}`)}</option>
                        ))}
                    </select>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`${styles.skeletonCard} skeleton`} />
                        ))}
                    </div>
                ) : therapists.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🩺</span>
                        <p>{t('noResults')}</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {therapists.map((therapist) => (
                            <button
                                key={therapist.id}
                                className={styles.card}
                                onClick={() => router.push(`/${locale}/therapists/${therapist.id}`)}
                            >
                                <div className={styles.cardHeader}>
                                    {therapist.photo_url ? (
                                        <img src={therapist.photo_url} alt={therapist.full_name} className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {therapist.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardName}>
                                            {therapist.full_name}
                                            {therapist.is_verified && <span className={styles.verifiedBadge} title="Verified">✓</span>}
                                        </h3>
                                        {therapist.title && (
                                            <span className={styles.cardTitle}>{therapist.title}</span>
                                        )}
                                        <div className={styles.cardRating}>
                                            <span className={styles.stars}>
                                                {'★'.repeat(Math.round(therapist.avg_rating || 0))}
                                                {'☆'.repeat(5 - Math.round(therapist.avg_rating || 0))}
                                            </span>
                                            <span className={styles.reviewCount}>
                                                ({therapist.review_count || 0})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {therapist.bio && (
                                    <p className={styles.cardBio}>{therapist.bio}</p>
                                )}

                                <div className={styles.cardMeta}>
                                    {therapist.city && (
                                        <span className={`badge badge-primary`}>
                                            📍 {therapist.city}{therapist.country ? `, ${therapist.country}` : ''}
                                        </span>
                                    )}
                                    <span className={`badge badge-warm`}>
                                        {t(`modalities.${therapist.modality}`)}
                                    </span>
                                    {therapist.languages?.length > 0 && (
                                        <span className={`badge badge-sage`}>
                                            🌐 {therapist.languages.join(', ')}
                                        </span>
                                    )}
                                </div>

                                {therapist.specializations?.length > 0 && (
                                    <div className={styles.cardSpecs}>
                                        {therapist.specializations.slice(0, 3).map((s) => (
                                            <span key={s} className={styles.specTag}>
                                                {t(`specializations.${s}`)}
                                            </span>
                                        ))}
                                        {therapist.specializations.length > 3 && (
                                            <span className={styles.specMore}>
                                                +{therapist.specializations.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

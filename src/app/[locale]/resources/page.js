'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ResourceCard from '@/components/resources/ResourceCard';
import styles from './resources.module.css';

export default function ResourcesPage() {
    const t = useTranslations('resources');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [lossFilter, setLossFilter] = useState('');
    const [worldviewFilter, setWorldviewFilter] = useState('');
    const [user, setUser] = useState(null);

    const resourceTypes = ['book', 'series', 'movie', 'comic', 'manga', 'song', 'other'];
    const lossTypes = ['parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'other', 'general'];
    const worldviews = ['secular', 'spiritual', 'christian', 'jewish', 'muslim', 'buddhist', 'hindu', 'universal'];

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();

        let query = supabase
            .from('resources')
            .select(`
        *,
        resource_loss_types (loss_type),
        profiles!resources_created_by_fkey (display_name)
      `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (typeFilter) {
            query = query.eq('type', typeFilter);
        }

        if (worldviewFilter) {
            query = query.eq('worldview', worldviewFilter);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (!error && data) {
            let filtered = data;
            if (lossFilter) {
                filtered = data.filter(r =>
                    r.resource_loss_types?.some(lt => lt.loss_type === lossFilter)
                );
            }
            setResources(filtered);
        }
        setLoading(false);
    }, [search, typeFilter, lossFilter, worldviewFilter]);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    return (
        <div className={styles.resourcesPage}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>{t('title')}</h1>
                        <p className={styles.subtitle}>{t('subtitle')}</p>
                    </div>
                    {user && (
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push(`/${locale}/resources/new`)}
                        >
                            + {t('addNew')}
                        </button>
                    )}
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
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">{t('allTypes')}</option>
                        {resourceTypes.map((type) => (
                            <option key={type} value={type}>{t(`types.${type}`)}</option>
                        ))}
                    </select>

                    <select
                        className={`form-input form-select ${styles.filterSelect}`}
                        value={lossFilter}
                        onChange={(e) => setLossFilter(e.target.value)}
                    >
                        <option value="">{t('allLossTypes')}</option>
                        {lossTypes.map((type) => (
                            <option key={type} value={type}>{t(`lossTypes.${type}`)}</option>
                        ))}
                    </select>

                    <select
                        className={`form-input form-select ${styles.filterSelect}`}
                        value={worldviewFilter}
                        onChange={(e) => setWorldviewFilter(e.target.value)}
                    >
                        <option value="">{t('allWorldviews')}</option>
                        {worldviews.map((wv) => (
                            <option key={wv} value={wv}>{t(`worldviews.${wv}`)}</option>
                        ))}
                    </select>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className={`${styles.skeletonCard} skeleton`} />
                        ))}
                    </div>
                ) : resources.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📚</span>
                        <p>{t('subtitle')}</p>
                        {user && (
                            <button
                                className="btn btn-primary"
                                onClick={() => router.push(`/${locale}/resources/new`)}
                            >
                                + {t('addNew')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {resources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} locale={locale} currentUser={user} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../resources.module.css';

export default function AddResourcePage() {
    const t = useTranslations('resources');
    const tAuth = useTranslations('auth');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [lossTypes, setLossTypes] = useState([]);
    const [externalUrl, setExternalUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [worldview, setWorldview] = useState('universal');
    const [authorOrCreator, setAuthorOrCreator] = useState('');
    const [focusTheme, setFocusTheme] = useState('');
    const [availability, setAvailability] = useState('');

    const resourceTypes = ['book', 'online_book', 'series', 'movie', 'comic', 'manga', 'song', 'post', 'other'];
    const worldviews = ['secular', 'spiritual', 'christian', 'jewish', 'muslim', 'buddhist', 'hindu', 'universal'];
    const allLossTypes = ['parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'other', 'general'];

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push(`/${locale}/auth/login`);
            } else {
                setUser(user);
            }
        });
    }, [locale, router]);

    const toggleLossType = (lt) => {
        setLossTypes((prev) =>
            prev.includes(lt) ? prev.filter((x) => x !== lt) : [...prev, lt]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!title || !type) {
            setError(tAuth('genericError'));
            return;
        }

        setLoading(true);

        const res = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                type,
                worldview,
                externalUrl: externalUrl || null,
                coverUrl: coverUrl || null,
                authorOrCreator: authorOrCreator || null,
                focusTheme: focusTheme || null,
                availability: availability || null,
                lossTypes,
            }),
        });

        if (!res.ok) {
            setError(tAuth('genericError'));
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
        setTitle('');
        setDescription('');
        setType('');
        setLossTypes([]);
        setExternalUrl('');
        setCoverUrl('');
        setWorldview('universal');
        setAuthorOrCreator('');
        setFocusTheme('');
        setAvailability('');
        setTimeout(() => {
            router.push(`/${locale}/resources`);
        }, 1500);
    };

    if (!user) return null;

    return (
        <div className={styles.addPage}>
            <div className={styles.addContainer}>
                <div className={styles.addCard}>
                    <div className={styles.addHeader}>
                        <h1>{t('addTitle')}</h1>
                        <p>{t('addSubtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.addForm}>
                        {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}
                        {success && <div className={styles.successMessage}>📋 {t('pendingMessage')}</div>}

                        <div className="form-group">
                            <label className="form-label">{t('formTitle')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formDescription')}</label>
                            <textarea
                                className="form-input form-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('formDescPlaceholder')}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formType')}</label>
                            <select
                                className="form-input form-select"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                required
                            >
                                <option value="">{t('formSelectType')}</option>
                                {resourceTypes.map((rt) => (
                                    <option key={rt} value={rt}>{t(`types.${rt}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formWorldview')}</label>
                            <select
                                className="form-input form-select"
                                value={worldview}
                                onChange={(e) => setWorldview(e.target.value)}
                            >
                                {worldviews.map((wv) => (
                                    <option key={wv} value={wv}>{t(`worldviews.${wv}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formLossTypes')}</label>
                            <div className={styles.lossTypeGrid}>
                                {allLossTypes.map((lt) => (
                                    <button
                                        key={lt}
                                        type="button"
                                        className={`${styles.lossTypeChip} ${lossTypes.includes(lt) ? styles.lossTypeChipActive : ''}`}
                                        onClick={() => toggleLossType(lt)}
                                    >
                                        {t(`lossTypes.${lt}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formAuthor')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={authorOrCreator}
                                onChange={(e) => setAuthorOrCreator(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formFocus')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={focusTheme}
                                onChange={(e) => setFocusTheme(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formAvailability')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={availability}
                                onChange={(e) => setAvailability(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formExternalUrl')}</label>
                            <input
                                type="url"
                                className="form-input"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('formCoverUrl')}</label>
                            <input
                                type="url"
                                className="form-input"
                                value={coverUrl}
                                onChange={(e) => setCoverUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading}
                            style={{ width: '100%', marginTop: 'var(--space-md)' }}
                        >
                            {loading ? '...' : t('formSubmit')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

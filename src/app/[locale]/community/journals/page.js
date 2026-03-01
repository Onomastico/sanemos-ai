'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import styles from './journals.module.css';

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
const WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];
const EMOTIONS = ['sadness','anger','nostalgia','gratitude','confusion','hope','peace','other'];
const GRIEF_STAGES = ['denial','anger','bargaining','depression','acceptance'];

export default function CommunityJournalsPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [loss_type, setLossType] = useState('');
    const [worldview, setWorldview] = useState('');
    const [emotion, setEmotion] = useState('');
    const [grief_stage, setGriefStage] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const lossLabels = { parent: es ? 'Padre/madre' : 'Parent', child: es ? 'Hijo/a' : 'Child', partner: es ? 'Pareja' : 'Partner', sibling: es ? 'Hermano/a' : 'Sibling', friend: es ? 'Amigo/a' : 'Friend', pet: es ? 'Mascota' : 'Pet', other: es ? 'Otro' : 'Other', general: es ? 'General' : 'General' };
    const worldviewLabels = { secular: 'Secular', spiritual: es ? 'Espiritual' : 'Spiritual', christian: es ? 'Cristiano' : 'Christian', jewish: es ? 'Judío' : 'Jewish', muslim: es ? 'Musulmán' : 'Muslim', buddhist: es ? 'Budista' : 'Buddhist', hindu: es ? 'Hindú' : 'Hindu', universal: 'Universal' };
    const emotionLabels = { sadness: es ? 'Tristeza 😢' : 'Sadness 😢', anger: es ? 'Enojo 😠' : 'Anger 😠', nostalgia: es ? 'Nostalgia 🥹' : 'Nostalgia 🥹', gratitude: es ? 'Gratitud 🙏' : 'Gratitude 🙏', confusion: es ? 'Confusión 😵' : 'Confusion 😵', hope: es ? 'Esperanza ✨' : 'Hope ✨', peace: es ? 'Paz 🌿' : 'Peace 🌿', other: es ? 'Otro 💭' : 'Other 💭' };
    const griefLabels = { denial: es ? 'Negación 🙈' : 'Denial 🙈', anger: es ? 'Ira 🔥' : 'Anger 🔥', bargaining: es ? 'Negociación 🙏' : 'Bargaining 🙏', depression: es ? 'Depresión 🌧️' : 'Depression 🌧️', acceptance: es ? 'Aceptación 🌱' : 'Acceptance 🌱' };

    const loadEntries = useCallback(async (p = 1) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p) });
        if (search) params.set('search', search);
        if (loss_type) params.set('loss_type', loss_type);
        if (worldview) params.set('worldview', worldview);
        if (emotion) params.set('emotion', emotion);
        if (grief_stage) params.set('grief_stage', grief_stage);

        const res = await fetch(`/api/community/journals?${params}`);
        if (res.ok) {
            const { entries: loaded } = await res.json();
            if (p === 1) setEntries(loaded);
            else setEntries(prev => [...prev, ...loaded]);
            setHasMore(loaded.length === 20);
            setPage(p);
        }
        setLoading(false);
    }, [search, loss_type, worldview, emotion, grief_stage]);

    useEffect(() => {
        loadEntries(1);
    }, [loadEntries]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>📖 {es ? 'Diarios de la Comunidad' : 'Community Journals'}</h1>
                <p className={styles.subtitle}>
                    {es
                        ? 'Escritos compartidos por personas en proceso de duelo'
                        : 'Writing shared by people navigating grief'}
                </p>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                        className={styles.searchInput}
                        placeholder={es ? 'Buscar...' : 'Search...'}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select className={styles.filterSelect} value={loss_type} onChange={e => setLossType(e.target.value)}>
                    <option value="">{es ? 'Pérdida' : 'Loss'}</option>
                    {LOSS_TYPES.map(k => <option key={k} value={k}>{lossLabels[k]}</option>)}
                </select>
                <select className={styles.filterSelect} value={emotion} onChange={e => setEmotion(e.target.value)}>
                    <option value="">{es ? 'Emoción' : 'Emotion'}</option>
                    {EMOTIONS.map(k => <option key={k} value={k}>{emotionLabels[k]}</option>)}
                </select>
                <select className={styles.filterSelect} value={grief_stage} onChange={e => setGriefStage(e.target.value)}>
                    <option value="">{es ? 'Etapa' : 'Stage'}</option>
                    {GRIEF_STAGES.map(k => <option key={k} value={k}>{griefLabels[k]}</option>)}
                </select>
                <select className={styles.filterSelect} value={worldview} onChange={e => setWorldview(e.target.value)}>
                    <option value="">{es ? 'Cosmovisión' : 'Worldview'}</option>
                    {WORLDVIEWS.map(k => <option key={k} value={k}>{worldviewLabels[k]}</option>)}
                </select>
            </div>

            {loading && entries.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>...</div>
            ) : entries.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📖</div>
                    <p className={styles.emptyText}>{es ? 'No hay entradas que coincidan con tu búsqueda.' : 'No entries match your search.'}</p>
                </div>
            ) : (
                <>
                    <div className={styles.grid}>
                        {entries.map(entry => (
                            <div key={entry.id} className={styles.card}>
                                <p className={styles.cardTitle}>{entry.title || (es ? 'Sin título' : 'Untitled')}</p>
                                <p className={styles.cardExcerpt}>{entry.excerpt}</p>
                                {(entry.emotion || entry.grief_stage || entry.loss_type) && (
                                    <div className={styles.cardTags}>
                                        {entry.emotion && <span className={styles.tag}>{emotionLabels[entry.emotion] || entry.emotion}</span>}
                                        {entry.grief_stage && <span className={styles.tag}>{griefLabels[entry.grief_stage] || entry.grief_stage}</span>}
                                        {entry.loss_type && <span className={styles.tag}>{lossLabels[entry.loss_type] || entry.loss_type}</span>}
                                    </div>
                                )}
                                <div className={styles.cardMeta}>
                                    <span className={styles.cardAuthor}>
                                        {entry.author_name || (es ? 'Anónimo' : 'Anonymous')}
                                    </span>
                                    <span className={styles.cardDate}>{formatDate(entry.created_at, locale)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className={styles.pagination}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => loadEntries(page + 1)}
                                disabled={loading}
                            >
                                {loading ? '...' : (es ? 'Cargar más' : 'Load more')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

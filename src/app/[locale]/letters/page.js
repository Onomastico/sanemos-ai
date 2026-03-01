'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './letters.module.css';

const LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
const WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function LettersPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lossType, setLossType] = useState('');
    const [worldview, setWorldview] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [authed, setAuthed] = useState(false);
    const [myLetters, setMyLetters] = useState([]);
    const [myLettersLoading, setMyLettersLoading] = useState(false);

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

    useEffect(() => {
        const check = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setAuthed(!!user);
            if (user) {
                setMyLettersLoading(true);
                const res = await fetch('/api/letters?mine=true');
                if (res.ok) {
                    const { letters: mine } = await res.json();
                    setMyLetters(mine || []);
                }
                setMyLettersLoading(false);
            }
        };
        check();
    }, []);

    const loadLetters = async (reset = false) => {
        const p = reset ? 1 : page;
        const params = new URLSearchParams({ page: String(p) });
        if (lossType) params.set('loss_type', lossType);
        if (worldview) params.set('worldview', worldview);

        const res = await fetch(`/api/letters?${params}`);
        if (res.ok) {
            const { letters: newLetters } = await res.json();
            if (reset) {
                setLetters(newLetters);
                setPage(2);
            } else {
                setLetters(prev => [...prev, ...newLetters]);
                setPage(p + 1);
            }
            setHasMore(newLetters.length === 20);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadLetters(true);
    }, [lossType, worldview]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.titleBlock}>
                    <h1 className={styles.title}>💌 {es ? 'Cartas' : 'Letters'}</h1>
                    <p className={styles.subtitle}>
                        {es
                            ? 'Palabras escritas desde el duelo, para quien las necesita'
                            : 'Words written from grief, for those who need them'}
                    </p>
                </div>
                {authed && (
                    <Link href={`/${locale}/letters/new`} className="btn btn-primary btn-sm">
                        + {es ? 'Escribir carta' : 'Write a letter'}
                    </Link>
                )}
            </div>

            {/* My letters section */}
            {authed && (myLettersLoading || myLetters.length > 0) && (
                <div className={styles.myLettersSection}>
                    <h2 className={styles.myLettersTitle}>
                        {es ? 'Mis cartas' : 'My letters'}
                    </h2>
                    {myLettersLoading ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>...</div>
                    ) : (
                        <div className={styles.myLettersList}>
                            {myLetters.map(letter => {
                                const statusStyle = letter.moderation_status === 'approved'
                                    ? styles.statusApproved
                                    : letter.moderation_status === 'rejected'
                                    ? styles.statusRejected
                                    : styles.statusPending;
                                const statusLabel = letter.moderation_status === 'approved'
                                    ? (es ? '✅ Pública' : '✅ Public')
                                    : letter.moderation_status === 'rejected'
                                    ? (es ? '❌ Rechazada' : '❌ Rejected')
                                    : (es ? '⏳ En revisión' : '⏳ In review');
                                return (
                                    <div
                                        key={letter.id}
                                        className={styles.myLetterRow}
                                        onClick={() => router.push(`/${locale}/letters/${letter.id}`)}
                                    >
                                        <p className={styles.myLetterExcerpt}>"{letter.excerpt}..."</p>
                                        <div className={styles.myLetterMeta}>
                                            <span className={`${styles.statusBadge} ${statusStyle}`}>{statusLabel}</span>
                                            {letter.loss_type && <span className={styles.tag}>{lossLabels[letter.loss_type] || letter.loss_type}</span>}
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{formatDate(letter.created_at, locale)}</span>
                                        </div>
                                        {letter.moderation_status === 'rejected' && letter.moderation_rejection_reason && (
                                            <p className={styles.myLetterRejection}>
                                                {es ? 'Razón: ' : 'Reason: '}{letter.moderation_rejection_reason}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.filters}>
                <select className={styles.filterSelect} value={lossType} onChange={e => setLossType(e.target.value)}>
                    <option value="">{es ? 'Tipo de pérdida' : 'Type of loss'}</option>
                    {LOSS_TYPES.map(k => <option key={k} value={k}>{lossLabels[k]}</option>)}
                </select>
                <select className={styles.filterSelect} value={worldview} onChange={e => setWorldview(e.target.value)}>
                    <option value="">{es ? 'Cosmovisión' : 'Worldview'}</option>
                    {WORLDVIEWS.map(k => <option key={k} value={k}>{worldviewLabels[k]}</option>)}
                </select>
                {(lossType || worldview) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setLossType(''); setWorldview(''); }}>
                        {es ? 'Limpiar' : 'Clear'}
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>...</div>
            ) : letters.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>💌</div>
                    <p className={styles.emptyText}>
                        {es ? 'Aún no hay cartas aprobadas.' : 'No approved letters yet.'}
                    </p>
                    {authed && (
                        <Link href={`/${locale}/letters/new`} className="btn btn-primary">
                            {es ? 'Ser el primero en escribir' : 'Be the first to write'}
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className={styles.grid}>
                        {letters.map(letter => (
                            <Link key={letter.id} href={`/${locale}/letters/${letter.id}`} className={styles.card}>
                                <p className={styles.cardQuote}>"{letter.excerpt}..."</p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardTags}>
                                        {letter.loss_type && <span className={styles.tag}>{lossLabels[letter.loss_type] || letter.loss_type}</span>}
                                        {letter.worldview && <span className={styles.tag}>{worldviewLabels[letter.worldview] || letter.worldview}</span>}
                                    </div>
                                    <div className={styles.cardMeta}>
                                        {letter.comment_count > 0 && (
                                            <span className={styles.commentIcon}>💬 {letter.comment_count}</span>
                                        )}
                                        <span>{formatDate(letter.created_at, locale)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {hasMore && (
                        <div className={styles.loadMore}>
                            <button className="btn btn-secondary" onClick={() => loadLetters(false)}>
                                {es ? 'Cargar más' : 'Load more'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

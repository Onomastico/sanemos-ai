'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './journal.module.css';

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    if (locale === 'es') {
        return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function statusBadge(entry, styles, es) {
    if (!entry.is_public && entry.moderation_status === 'private') {
        return <span className={`${styles.statusBadge} ${styles.statusPrivate}`}>{es ? '🔒 Privada' : '🔒 Private'}</span>;
    }
    if (entry.moderation_status === 'pending') {
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>{es ? '⏳ En revisión' : '⏳ In review'}</span>;
    }
    if (entry.moderation_status === 'approved') {
        return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>{es ? '✅ Pública' : '✅ Public'}</span>;
    }
    if (entry.moderation_status === 'rejected') {
        return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>{es ? '❌ Rechazada' : '❌ Rejected'}</span>;
    }
    return null;
}

function buildCalendarDays(year, month) {
    // month is 0-indexed
    const firstDay = new Date(year, month, 1);
    // ISO week starts Monday. getDay() returns 0=Sun, so shift.
    const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    // Padding from previous month
    for (let i = startDow - 1; i >= 0; i--) {
        cells.push({ day: prevMonthDays - i, thisMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, thisMonth: true });
    }
    // Padding to complete last week
    let next = 1;
    while (cells.length % 7 !== 0) {
        cells.push({ day: next++, thisMonth: false });
    }
    return cells;
}

export default function JournalPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [loading, setLoading] = useState(true);
    const [authed, setAuthed] = useState(false);
    const [view, setView] = useState('list'); // 'list' | 'calendar'

    // List state
    const [entries, setEntries] = useState([]);
    const [search, setSearch] = useState('');
    const [emotion, setEmotion] = useState('');
    const [grief_stage, setGriefStage] = useState('');

    // Calendar state
    const today = new Date();
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
    // calEntries: lightweight entry list for current month { id, title, created_at, is_public, moderation_status }
    const [calEntries, setCalEntries] = useState([]);

    // Check auth
    useEffect(() => {
        const check = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/${locale}/auth/login`);
                return;
            }
            setAuthed(true);
            setLoading(false);
        };
        check();
    }, [locale, router]);

    const loadList = useCallback(async () => {
        const params = new URLSearchParams({ view: 'list' });
        if (search) params.set('search', search);
        if (emotion) params.set('emotion', emotion);
        if (grief_stage) params.set('grief_stage', grief_stage);
        const res = await fetch(`/api/journal?${params}`);
        if (res.ok) {
            const { entries } = await res.json();
            setEntries(entries);
        }
    }, [search, emotion, grief_stage]);

    const loadCalendar = useCallback(async () => {
        const month = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
        const res = await fetch(`/api/journal?view=calendar&month=${month}`);
        if (res.ok) {
            const { entries } = await res.json();
            setCalEntries(entries || []);
        }
    }, [calYear, calMonth]);

    useEffect(() => {
        if (!authed) return;
        if (view === 'list') loadList();
        else loadCalendar();
    }, [authed, view, loadList, loadCalendar]);

    // Build a map of date → entries for the calendar
    const dayMap = {};
    for (const e of calEntries) {
        const date = e.created_at.split('T')[0];
        if (!dayMap[date]) dayMap[date] = [];
        dayMap[date].push(e);
    }

    const cells = buildCalendarDays(calYear, calMonth);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const DAYS = es ? DAYS_ES : DAYS_EN;
    const MONTHS = es ? MONTHS_ES : MONTHS_EN;

    const emotions = {
        sadness: es ? 'Tristeza 😢' : 'Sadness 😢',
        anger: es ? 'Enojo 😠' : 'Anger 😠',
        nostalgia: es ? 'Nostalgia 🥹' : 'Nostalgia 🥹',
        gratitude: es ? 'Gratitud 🙏' : 'Gratitude 🙏',
        confusion: es ? 'Confusión 😵' : 'Confusion 😵',
        hope: es ? 'Esperanza ✨' : 'Hope ✨',
        peace: es ? 'Paz 🌿' : 'Peace 🌿',
        other: es ? 'Otro 💭' : 'Other 💭',
    };

    const griefStages = {
        denial: es ? 'Negación 🙈' : 'Denial 🙈',
        anger: es ? 'Ira 🔥' : 'Anger 🔥',
        bargaining: es ? 'Negociación 🙏' : 'Bargaining 🙏',
        depression: es ? 'Depresión 🌧️' : 'Depression 🌧️',
        acceptance: es ? 'Aceptación 🌱' : 'Acceptance 🌱',
    };

    if (loading) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>📔 {es ? 'Mi Diario' : 'My Journal'}</h1>
                <div className={styles.headerActions}>
                    <div className={styles.viewToggle}>
                        <button className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`} onClick={() => setView('list')}>
                            {es ? 'Lista' : 'List'}
                        </button>
                        <button className={`${styles.viewBtn} ${view === 'calendar' ? styles.active : ''}`} onClick={() => setView('calendar')}>
                            {es ? 'Calendario' : 'Calendar'}
                        </button>
                    </div>
                    <Link href={`/${locale}/journal/new`} className="btn btn-primary btn-sm">
                        + {es ? 'Nueva entrada' : 'New entry'}
                    </Link>
                </div>
            </div>

            {view === 'list' && (
                <>
                    <div className={styles.filters}>
                        <div className={styles.searchWrapper}>
                            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input
                                className={styles.searchInput}
                                placeholder={es ? 'Buscar entradas...' : 'Search entries...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select className={styles.filterSelect} value={emotion} onChange={e => setEmotion(e.target.value)}>
                            <option value="">{es ? 'Emoción' : 'Emotion'}</option>
                            {Object.entries(emotions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={grief_stage} onChange={e => setGriefStage(e.target.value)}>
                            <option value="">{es ? 'Etapa del duelo' : 'Grief stage'}</option>
                            {Object.entries(griefStages).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    {entries.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📔</div>
                            <p className={styles.emptyText}>{es ? 'Aún no tienes entradas.' : 'No entries yet.'}</p>
                            <Link href={`/${locale}/journal/new`} className="btn btn-primary">{es ? 'Escribir algo hoy' : 'Write something today'}</Link>
                        </div>
                    ) : (
                        <div className={styles.entryList}>
                            {entries.map(entry => (
                                <Link key={entry.id} href={`/${locale}/journal/${entry.id}`} className={styles.entryCard}>
                                    <div className={styles.entryCardTop}>
                                        <p className={styles.entryTitle}>{entry.title || (es ? 'Sin título' : 'Untitled')}</p>
                                        <span className={styles.entryDate}>{formatDate(entry.created_at, locale)}</span>
                                    </div>
                                    <p className={styles.entryExcerpt}>{entry.excerpt}</p>
                                    <div className={styles.entryTags}>
                                        {statusBadge(entry, styles, es)}
                                        {entry.emotion && <span className={styles.tag}>{emotions[entry.emotion] || entry.emotion}</span>}
                                        {entry.grief_stage && <span className={styles.tag}>{griefStages[entry.grief_stage] || entry.grief_stage}</span>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {view === 'calendar' && (
                <>
                    <div className={styles.calendarNav}>
                        <button className={styles.calendarNavBtn} onClick={() => {
                            if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                            else setCalMonth(m => m - 1);
                            setSelectedDay(null);
                        }}>← {es ? 'Anterior' : 'Prev'}</button>
                        <span className={styles.calendarMonthLabel}>{MONTHS[calMonth]} {calYear}</span>
                        <button className={styles.calendarNavBtn} onClick={() => {
                            if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                            else setCalMonth(m => m + 1);
                            setSelectedDay(null);
                        }}>{es ? 'Siguiente' : 'Next'} →</button>
                    </div>

                    <div className={styles.calendarGrid}>
                        {DAYS.map(d => (
                            <div key={d} className={styles.calendarDayHeader}>{d}</div>
                        ))}
                        {cells.map((cell, i) => {
                            const dateStr = cell.thisMonth
                                ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                                : null;
                            const dayEntries = dateStr ? (dayMap[dateStr] || []) : [];
                            const isToday = dateStr === todayStr;
                            // Show up to 2 badges; if more, show overflow dot
                            const MAX_BADGES = 2;
                            const shown = dayEntries.slice(0, MAX_BADGES);
                            const overflow = dayEntries.length > MAX_BADGES;
                            return (
                                <div
                                    key={i}
                                    className={`${styles.calendarCell} ${!cell.thisMonth ? styles.otherMonth : ''} ${dayEntries.length > 0 ? styles.hasEntries : ''} ${isToday ? styles.isToday : ''}`}
                                >
                                    <span className={styles.calendarDayNum}>{cell.day}</span>
                                    {shown.map(entry => (
                                        <Link
                                            key={entry.id}
                                            href={`/${locale}/journal/${entry.id}`}
                                            className={`${styles.calendarEntryBadge} ${entry.moderation_status === 'approved' ? styles.calendarEntryBadgePublic : ''}`}
                                            title={entry.title || (es ? 'Sin título' : 'Untitled')}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {entry.title || (es ? 'Sin título' : 'Untitled')}
                                        </Link>
                                    ))}
                                    {overflow && (
                                        <span className={styles.calendarDot} title={`+${dayEntries.length - MAX_BADGES} más`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                        <Link href={`/${locale}/journal/new`} className="btn btn-primary">
                            + {es ? 'Nueva entrada' : 'New entry'}
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

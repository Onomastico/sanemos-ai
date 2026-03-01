'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminPage() {
    const t = useTranslations('admin');
    const tRes = useTranslations('resources');
    const tTher = useTranslations('therapists');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [isAdmin, setIsAdmin] = useState(false);
    const [isModerator, setIsModerator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('review'); // default to review tab

    // Data
    const [resources, setResources] = useState([]);
    const [pendingResources, setPendingResources] = useState([]);
    const [pendingComments, setPendingComments] = useState([]);
    const [pendingTherapists, setPendingTherapists] = useState([]);
    const [therapists, setTherapists] = useState([]);
    const [users, setUsers] = useState([]);

    // Settings
    const [settings, setSettings] = useState({});
    const [savingSettings, setSavingSettings] = useState(false);

    // Modal state
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Rejection modal
    const [rejectModal, setRejectModal] = useState(null); // { resourceId }
    const [rejectionReason, setRejectionReason] = useState('');

    // Pending journal entries
    const [pendingJournals, setPendingJournals] = useState([]);
    const [journalRejectModal, setJournalRejectModal] = useState(null);
    const [journalRejectReason, setJournalRejectReason] = useState('');

    // Pending letters
    const [pendingLetters, setPendingLetters] = useState([]);
    const [letterRejectModal, setLetterRejectModal] = useState(null);
    const [letterRejectReason, setLetterRejectReason] = useState('');

    // Volunteers
    const [volunteers, setVolunteers] = useState([]);
    const [volunteerShifts, setVolunteerShifts] = useState([]);
    const [currentWeekStr, setCurrentWeekStr] = useState('');
    const [volSubTab, setVolSubTab] = useState('applications');
    const [shiftModal, setShiftModal] = useState(null);
    const [shiftForm, setShiftForm] = useState({ volunteer_id: '', date: '', start_hour: '09', end_hour: '11', notes: '' });
    const [sendingNotification, setSendingNotification] = useState(null);
    const [volRejectModal, setVolRejectModal] = useState(null);
    const [volRejectReason, setVolRejectReason] = useState('');



    const loadResources = async () => {
        const res = await fetch('/api/admin/resources');
        const data = await res.json();
        setResources(data.resources || []);
    };

    const loadPendingResources = async () => {
        const res = await fetch('/api/admin/resources?status=pending');
        const data = await res.json();
        setPendingResources(data.resources || []);
    };

    const loadPendingComments = async () => {
        const res = await fetch('/api/admin/reviews?status=pending');
        const data = await res.json();
        setPendingComments(data.reviews || []);
    };

    const loadTherapists = async () => {
        const res = await fetch('/api/admin/therapists');
        const data = await res.json();
        setTherapists(data.therapists || []);
    };

    const loadPendingTherapists = async () => {
        const res = await fetch('/api/admin/therapists?status=pending');
        const data = await res.json();
        setPendingTherapists(data.therapists || []);
    };

    const loadPendingJournals = async () => {
        const res = await fetch('/api/admin/journal?status=pending');
        const data = await res.json();
        setPendingJournals(data.entries || []);
    };

    const loadPendingLetters = async () => {
        const res = await fetch('/api/admin/letters?status=pending');
        const data = await res.json();
        setPendingLetters(data.letters || []);
    };

    const loadUsers = async () => {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
    };

    // ── Volunteer helpers ──────────────────────────────────────────────────────

    const getISOWeekStr = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
        const week1 = new Date(d.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    };

    const getMondayOfWeek = (weekStr) => {
        const [yearStr, wStr] = weekStr.split('-W');
        const year = parseInt(yearStr);
        const week = parseInt(wStr);
        const jan4 = new Date(year, 0, 4);
        const dow = jan4.getDay() || 7;
        const monday = new Date(jan4);
        monday.setDate(jan4.getDate() - dow + 1 + (week - 1) * 7);
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const shiftComplianceBadge = (shift) => {
        const now = new Date();
        const start = new Date(shift.start_time);
        const end = new Date(shift.end_time);
        const checkin = shift.volunteer_checkins?.[0];

        if (checkin) {
            const checkinAt = new Date(checkin.checked_in_at);
            const lateMs = checkinAt - start;
            if (!checkin.checked_out_at && now >= start && now <= end) {
                return <span className="badge badge-calm" style={{ fontSize: '10px' }}>🟢 En turno</span>;
            }
            if (lateMs <= 15 * 60 * 1000) {
                return <span className="badge badge-calm" style={{ fontSize: '10px' }}>✅ Cumplido</span>;
            }
            return <span className="badge badge-warm" style={{ fontSize: '10px' }}>⚠️ Tardío</span>;
        }

        if (now > end) return <span className="badge badge-alert" style={{ fontSize: '10px' }}>❌ No asistió</span>;
        if (shift.status === 'confirmed') return <span className="badge badge-primary" style={{ fontSize: '10px' }}>🔵 Confirmado</span>;
        if (shift.status === 'declined') return <span className="badge badge-alert" style={{ fontSize: '10px' }}>✗ Rechazado</span>;
        return <span className="badge" style={{ fontSize: '10px', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>⬜ Programado</span>;
    };

    const loadVolunteers = async () => {
        const res = await fetch('/api/admin/volunteers');
        const data = await res.json();
        setVolunteers(data.volunteers || []);
    };

    const loadVolunteerShifts = async (week) => {
        const res = await fetch(`/api/admin/volunteer-shifts?week=${week}`);
        const data = await res.json();
        setVolunteerShifts(data.shifts || []);
    };

    const handleVolunteerApprove = async (id) => {
        await fetch(`/api/admin/volunteers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' }),
        });
        loadVolunteers();
    };

    const handleVolunteerReject = async () => {
        if (!volRejectModal) return;
        await fetch(`/api/admin/volunteers/${volRejectModal}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', rejection_reason: volRejectReason || null }),
        });
        setVolRejectModal(null);
        setVolRejectReason('');
        loadVolunteers();
    };

    const handleCreateShift = async () => {
        if (!shiftForm.volunteer_id || !shiftForm.date || !shiftForm.start_hour || !shiftForm.end_hour) return;
        const startTime = new Date(`${shiftForm.date}T${shiftForm.start_hour}:00:00`);
        const endTime = new Date(`${shiftForm.date}T${shiftForm.end_hour}:00:00`);
        await fetch('/api/admin/volunteer-shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                volunteer_id: shiftForm.volunteer_id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                notes: shiftForm.notes || null,
            }),
        });
        setShiftModal(null);
        setShiftForm({ volunteer_id: '', date: '', start_hour: '09', end_hour: '11', notes: '' });
        loadVolunteerShifts(currentWeekStr);
    };

    const handleCancelShift = async (id) => {
        if (!confirm(locale === 'es' ? '¿Cancelar este turno?' : 'Cancel this shift?')) return;
        await fetch(`/api/admin/volunteer-shifts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
        });
        setShiftModal(null);
        loadVolunteerShifts(currentWeekStr);
    };

    const handleNotifyShift = async (id) => {
        setSendingNotification(id);
        await fetch(`/api/admin/volunteer-shifts/${id}/notify`, { method: 'POST' });
        setSendingNotification(null);
        loadVolunteerShifts(currentWeekStr);
    };

    const navigateWeek = (direction) => {
        const monday = getMondayOfWeek(currentWeekStr);
        monday.setDate(monday.getDate() + direction * 7);
        const newWeek = getISOWeekStr(monday);
        setCurrentWeekStr(newWeek);
        loadVolunteerShifts(newWeek);
    };

    // ── End volunteer helpers ──────────────────────────────────────────────────

    const loadSettings = async () => {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        const settingsObj = {};
        if (data.settings) {
            data.settings.forEach(s => {
                settingsObj[s.key] = typeof s.value === 'string' ? s.value.replace(/"/g, '') : s.value;
            });
        }
        setSettings(settingsObj);
    };

    useEffect(() => {
        const init = async () => {
            const res = await fetch('/api/admin/check');
            const data = await res.json();
            if (!data.isStaff) {
                router.push(`/${locale}/dashboard`);
                return;
            }
            setIsAdmin(data.isAdmin);
            setIsModerator(data.isModerator);
            setLoading(false);
            loadPendingResources();
            loadPendingComments();
            loadPendingJournals();
            loadPendingLetters();
            if (data.isAdmin) {
                loadPendingTherapists();
                loadResources();
                loadTherapists();
                loadSettings();
                loadUsers();
                loadVolunteers();
                const weekStr = getISOWeekStr(new Date());
                setCurrentWeekStr(weekStr);
                loadVolunteerShifts(weekStr);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale, router]);

    const handleToggleAIProvider = async (provider) => {
        setSavingSettings(true);
        setSettings(prev => ({ ...prev, active_ai_provider: provider }));
        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'active_ai_provider', value: provider }),
        });
        setSavingSettings(false);
    };

    const handleToggleSetting = async (key, value) => {
        setSavingSettings(true);
        setSettings(prev => ({ ...prev, [key]: value }));
        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
        });
        setSavingSettings(false);
    };

    const aiModerationBadge = (result) => {
        if (!result) return null;
        const { decision, reason, confidence } = result;
        const pct = Math.round((confidence || 0) * 100);
        let color, label;
        if (decision === 'approve') {
            color = 'var(--accent-calm)';
            label = locale === 'es' ? `Aprobar sugerido (${pct}%)` : `Approve suggested (${pct}%)`;
        } else if (decision === 'reject') {
            color = 'var(--accent-alert)';
            label = locale === 'es' ? `Rechazar sugerido (${pct}%)` : `Reject suggested (${pct}%)`;
        } else {
            color = 'var(--text-muted)';
            label = locale === 'es' ? `Incierto (${pct}%)` : `Uncertain (${pct}%)`;
        }
        return (
            <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', border: `1px solid ${color}`, display: 'inline-flex', flexDirection: 'column', gap: 2, maxWidth: '100%' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color }}>🤖 {label}</span>
                {reason && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{reason}</span>}
            </div>
        );
    };

    const handleApprove = async (id) => {
        await fetch(`/api/admin/resources/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' }),
        });
        loadPendingResources();
        if (isAdmin) loadResources();
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        await fetch(`/api/admin/resources/${rejectModal.resourceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason || null }),
        });
        setRejectModal(null);
        setRejectionReason('');
        loadPendingResources();
        if (isAdmin) loadResources();
    };

    const handleApproveComment = async (id) => {
        await fetch('/api/admin/reviews', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'approved' }),
        });
        loadPendingComments();
    };

    const handleRejectComment = async (id) => {
        await fetch('/api/admin/reviews', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'rejected' }),
        });
        loadPendingComments();
    };

    const openAdd = (type) => {
        setForm(type === 'resource'
            ? { title: '', description: '', type: 'book', worldview: 'universal', external_url: '', cover_url: '', author_or_creator: '', focus_theme: '', availability: '' }
            : { full_name: '', title: '', bio: '', email: '', phone: '', website: '', linkedin_url: '', credentials_url: '', city: '', country: '', modality: 'both', languages: 'en,es', specializations: '', license_number: '', is_verified: false }
        );
        setModal({ type, mode: 'add' });
    };

    const openEdit = (type, item) => {
        if (type === 'resource') {
            setForm({ title: item.title || '', description: item.description || '', type: item.type || 'book', worldview: item.worldview || 'universal', external_url: item.external_url || '', cover_url: item.cover_url || '', author_or_creator: item.author_or_creator || '', focus_theme: item.focus_theme || '', availability: item.availability || '' });
        } else {
            setForm({
                full_name: item.full_name || '', title: item.title || '', bio: item.bio || '',
                email: item.email || '', phone: item.phone || '', website: item.website || '',
                linkedin_url: item.linkedin_url || '', credentials_url: item.credentials_url || '',
                city: item.city || '', country: item.country || '', modality: item.modality || 'both',
                languages: (item.languages || []).join(', '),
                specializations: (item.specializations || []).join(', '),
                license_number: item.license_number || '', is_verified: item.is_verified || false,
            });
        }
        setModal({ type, mode: 'edit', data: item });
    };

    const handleSave = async () => {
        setSaving(true);
        const isResource = modal.type === 'resource';
        const isEdit = modal.mode === 'edit';
        const baseUrl = `/api/admin/${isResource ? 'resources' : 'therapists'}`;
        const url = isEdit ? `${baseUrl}/${modal.data.id}` : baseUrl;

        const body = isResource ? form : {
            ...form,
            languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
            specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
        };

        await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        setModal(null);
        setSaving(false);
        if (isResource) {
            loadResources();
            loadPendingResources();
        } else {
            loadTherapists();
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm(t('confirmDelete'))) return;
        const baseUrl = `/api/admin/${type === 'resource' ? 'resources' : 'therapists'}`;
        await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
        if (type === 'resource') {
            loadResources();
            loadPendingResources();
        } else {
            loadTherapists();
        }
    };

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    if (loading) return null;

    const resourceTypes = ['book', 'online_book', 'series', 'movie', 'comic', 'manga', 'song', 'post', 'other'];
    const lossTypes = ['parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'other', 'general'];
    const worldviews = ['secular', 'spiritual', 'christian', 'jewish', 'muslim', 'buddhist', 'hindu', 'universal'];

    const statusBadge = (status) => {
        const cls = status === 'approved' ? 'badge-calm' : status === 'rejected' ? 'badge-alert' : 'badge-warm';
        return <span className={`badge ${cls}`}>{t(`status_${status}`)}</span>;
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>🛡️ {t('title')}</h1>
                    <p className={styles.subtitle}>{t('subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === 'review' ? styles.tabActive : ''}`}
                        onClick={() => setTab('review')}
                    >
                        📋 {t('reviewTab')} ({pendingResources.length + pendingComments.length + pendingTherapists.length + pendingJournals.length + pendingLetters.length})
                    </button>
                    {isAdmin && (
                        <button
                            className={`${styles.tab} ${tab === 'resources' ? styles.tabActive : ''}`}
                            onClick={() => setTab('resources')}
                        >
                            📚 {t('resourcesTab')} ({resources.length})
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className={`${styles.tab} ${tab === 'therapists' ? styles.tabActive : ''}`}
                            onClick={() => setTab('therapists')}
                        >
                            🩺 {t('therapistsTab')} ({therapists.length})
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`}
                            onClick={() => setTab('users')}
                        >
                            👥 {locale === 'es' ? 'Usuarios' : 'Users'} ({users.length})
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`}
                            onClick={() => setTab('settings')}
                        >
                            ⚙️ {t('settingsTab')}
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className={`${styles.tab} ${tab === 'volunteers' ? styles.tabActive : ''}`}
                            onClick={() => setTab('volunteers')}
                        >
                            🤝 {locale === 'es' ? 'Voluntarios' : 'Volunteers'} ({volunteers.length})
                        </button>
                    )}
                </div>

                {/* Review Tab */}
                {tab === 'review' && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>{t('pendingResources')}</h2>
                        </div>

                        {pendingResources.length === 0 ? (
                            <div className={styles.emptyReview}>
                                <span className={styles.emptyIcon}>✅</span>
                                <p>{t('noPending')}</p>
                            </div>
                        ) : (
                            <div className={styles.reviewList}>
                                {pendingResources.map((r) => (
                                    <div key={r.id} className={styles.reviewCard}>
                                        <div className={styles.reviewCardHeader}>
                                            <div>
                                                <h3>{r.title}</h3>
                                                <div className={styles.reviewCardMeta}>
                                                    <span className="badge badge-primary">{tRes(`types.${r.type}`)}</span>
                                                    {r.worldview && r.worldview !== 'universal' && (
                                                        <span className="badge badge-sage">{tRes(`worldviews.${r.worldview}`)}</span>
                                                    )}
                                                    <span className={styles.reviewCardAuthor}>
                                                        {t('submittedBy')} {r.profiles?.display_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {r.description && (
                                            <p className={styles.reviewCardDesc}>{r.description}</p>
                                        )}
                                        {r.external_url && (
                                            <a href={r.external_url} target="_blank" rel="noopener noreferrer" className={styles.reviewCardLink}>
                                                🔗 {r.external_url}
                                            </a>
                                        )}
                                        {r.cover_url && (
                                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-alert)', fontWeight: 600 }}>
                                                    ⚠️ Cover image (verify before approving):
                                                </span>
                                                <div style={{ marginTop: 'var(--space-xs)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                                                    <img
                                                        src={r.cover_url}
                                                        alt="Cover"
                                                        style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-alert)', flexShrink: 0 }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                    <a href={r.cover_url} target="_blank" rel="noopener noreferrer" className={styles.reviewCardLink} style={{ wordBreak: 'break-all' }}>
                                                        {r.cover_url}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {aiModerationBadge(r.ai_moderation_result)}
                                        <div className={styles.reviewCardActions}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleApprove(r.id)}
                                            >
                                                ✓ {t('approve')}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setRejectModal({ resourceId: r.id })}
                                            >
                                                ✗ {t('reject')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pending Comments */}
                        <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-xl)' }}>
                            <h2>💬 {t('pendingComments')}</h2>
                        </div>

                        {pendingComments.length === 0 ? (
                            <div className={styles.emptyReview}>
                                <span className={styles.emptyIcon}>✅</span>
                                <p>{t('noPendingComments')}</p>
                            </div>
                        ) : (
                            <div className={styles.reviewList}>
                                {pendingComments.map((c) => (
                                    <div key={c.id} className={styles.reviewCard}>
                                        <div className={styles.reviewCardHeader}>
                                            <div>
                                                <h3>{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</h3>
                                                <div className={styles.reviewCardMeta}>
                                                    <span className={styles.reviewCardAuthor}>
                                                        {t('submittedBy')} {c.profiles?.display_name || 'Unknown'}
                                                    </span>
                                                    <span className="badge badge-primary">
                                                        {c.resources?.title || 'Unknown resource'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {c.comment && (
                                            <p className={styles.reviewCardDesc}>{c.comment}</p>
                                        )}
                                        {aiModerationBadge(c.ai_moderation_result)}
                                        <div className={styles.reviewCardActions}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleApproveComment(c.id)}
                                            >
                                                ✓ {t('approve')}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleRejectComment(c.id)}
                                            >
                                                ✗ {t('reject')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Pending Journal Entries */}
                        {pendingJournals.length > 0 && (
                            <>
                                <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-xl)' }}>
                                    <h2>📔 {locale === 'es' ? 'Diarios Pendientes de Revisión' : 'Pending Journal Entries'}</h2>
                                </div>
                                <div className={styles.reviewList}>
                                    {pendingJournals.map((entry) => (
                                        <div key={entry.id} className={styles.reviewCard}>
                                            <div className={styles.reviewCardHeader}>
                                                <div>
                                                    <h3>{entry.title || (locale === 'es' ? 'Sin título' : 'Untitled')}</h3>
                                                    <small style={{ color: 'var(--text-muted)' }}>
                                                        {entry.profiles?.display_name || (locale === 'es' ? 'Anónimo' : 'Anonymous')}
                                                        {' · '}{new Date(entry.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US')}
                                                    </small>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-sm) 0' }}>
                                                {entry.excerpt}
                                            </p>
                                            {aiModerationBadge(entry.ai_moderation_result)}
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={async () => {
                                                        await fetch(`/api/admin/journal/${entry.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'approved' }),
                                                        });
                                                        loadPendingJournals();
                                                    }}
                                                >
                                                    ✓ {t('approve')}
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => {
                                                        setJournalRejectModal(entry.id);
                                                        setJournalRejectReason('');
                                                    }}
                                                >
                                                    ✗ {t('reject')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Pending Letters */}
                        <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-xl)' }}>
                            <h2>💌 {locale === 'es' ? 'Cartas Pendientes de Revisión' : 'Pending Letters'}</h2>
                        </div>

                        {pendingLetters.length === 0 ? (
                            <div className={styles.emptyReview}>
                                <span className={styles.emptyIcon}>✅</span>
                                <p>{locale === 'es' ? 'No hay cartas pendientes de revisión.' : 'No letters pending review.'}</p>
                            </div>
                        ) : (
                            <div className={styles.reviewList}>
                                {pendingLetters.map((letter) => (
                                    <div key={letter.id} className={styles.reviewCard}>
                                        <div className={styles.reviewCardHeader}>
                                            <div>
                                                <div className={styles.reviewCardMeta}>
                                                    {letter.loss_type && <span className="badge badge-primary">{letter.loss_type}</span>}
                                                    {letter.worldview && <span className="badge badge-sage">{letter.worldview}</span>}
                                                    <span className={styles.reviewCardAuthor}>
                                                        {letter.author_name || (locale === 'es' ? 'Anónimo' : 'Anonymous')}
                                                        {' · '}{new Date(letter.created_at).toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-sm) 0', lineHeight: 1.6 }}>
                                            {letter.excerpt}
                                            {letter.excerpt && letter.excerpt.length >= 300 ? '...' : ''}
                                        </p>
                                        {aiModerationBadge(letter.ai_moderation_result)}
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={async () => {
                                                    await fetch(`/api/admin/letters/${letter.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ status: 'approved' }),
                                                    });
                                                    loadPendingLetters();
                                                }}
                                            >
                                                ✓ {t('approve')}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setLetterRejectModal(letter.id);
                                                    setLetterRejectReason('');
                                                }}
                                            >
                                                ✗ {t('reject')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pending Therapists */}
                        {isAdmin && pendingTherapists.length > 0 && (
                            <>
                                <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-xl)' }}>
                                    <h2>🩺 {locale === 'es' ? 'Terapeutas Pendientes' : 'Pending Therapists'}</h2>
                                </div>
                                <div className={styles.reviewList}>
                                    {pendingTherapists.map((th) => (
                                        <div key={th.id} className={styles.reviewCard}>
                                            <div className={styles.reviewCardHeader}>
                                                <div>
                                                    <h3>{th.full_name}</h3>
                                                    <div className={styles.reviewCardMeta}>
                                                        <span className="badge badge-primary">{tTher(`modalities.${th.modality}`)}</span>
                                                        <span className={styles.reviewCardAuthor}>
                                                            {t('submittedBy')} {th.profiles?.display_name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {th.bio && (
                                                <p className={styles.reviewCardDesc}>{th.bio}</p>
                                            )}
                                            {aiModerationBadge(th.ai_moderation_result)}
                                            <div className={styles.reviewCardActions}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={async () => {
                                                        await fetch(`/api/admin/therapists/${th.id}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'approved' }),
                                                        });
                                                        loadPendingTherapists();
                                                        loadTherapists();
                                                    }}
                                                >
                                                    ✓ {t('approve')}
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={async () => {
                                                        const reason = prompt(t('rejectionReasonPlaceholder'));
                                                        if (reason !== null) {
                                                            await fetch(`/api/admin/therapists/${th.id}`, {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ status: 'rejected', rejection_reason: reason || null }),
                                                            });
                                                            loadPendingTherapists();
                                                            loadTherapists();
                                                        }
                                                    }}
                                                >
                                                    ✗ {t('reject')}
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => openEdit('therapist', th)}
                                                >
                                                    ✏️ {t('edit')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Resources Tab (Admin only) */}
                {tab === 'resources' && isAdmin && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>{t('manageResources')}</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => openAdd('resource')}>
                                + {t('add')}
                            </button>
                        </div>

                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <span className={styles.colTitle}>{t('colTitle')}</span>
                                <span className={styles.colType}>{t('colType')}</span>
                                <span className={styles.colWorldview}>{t('colStatus')}</span>
                                <span className={styles.colActions}>{t('colActions')}</span>
                            </div>
                            {resources.map((r) => (
                                <div key={r.id} className={styles.tableRow}>
                                    <span className={styles.colTitle}>{r.title}</span>
                                    <span className={styles.colType}>
                                        <span className="badge badge-primary">{tRes(`types.${r.type}`)}</span>
                                    </span>
                                    <span className={styles.colWorldview}>
                                        {statusBadge(r.status || 'approved')}
                                    </span>
                                    <span className={styles.colActions}>
                                        <button className={styles.editBtn} onClick={() => openEdit('resource', r)}>✏️</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete('resource', r.id)}>🗑</button>
                                    </span>
                                </div>
                            ))}
                            {resources.length === 0 && (
                                <div className={styles.emptyRow}>{t('noItems')}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Therapists Tab (Admin only) */}
                {tab === 'therapists' && isAdmin && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>{t('manageTherapists')}</h2>
                            <button className="btn btn-primary btn-sm" onClick={() => openAdd('therapist')}>
                                + {t('add')}
                            </button>
                        </div>

                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <span className={styles.colTitle}>{t('colName')}</span>
                                <span className={styles.colType}>{t('colModality')}</span>
                                <span className={styles.colWorldview}>{t('colVerified')}</span>
                                <span className={styles.colActions}>{t('colActions')}</span>
                            </div>
                            {therapists.map((th) => (
                                <div key={th.id} className={styles.tableRow}>
                                    <span className={styles.colTitle}>
                                        {th.full_name}
                                        {th.city && <small style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>📍 {th.city}</small>}
                                    </span>
                                    <span className={styles.colType}>
                                        <span className="badge badge-warm">{tTher(`modalities.${th.modality}`)}</span>
                                    </span>
                                    <span className={styles.colWorldview}>
                                        {th.is_verified ? '✅' : '—'}
                                    </span>
                                    <span className={styles.colActions}>
                                        <button className={styles.editBtn} onClick={() => openEdit('therapist', th)}>✏️</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete('therapist', th.id)}>🗑</button>
                                    </span>
                                </div>
                            ))}
                            {therapists.length === 0 && (
                                <div className={styles.emptyRow}>{t('noItems')}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Users Tab (Admin only) */}
                {tab === 'users' && isAdmin && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>👥 {locale === 'es' ? 'Gestionar Usuarios y Strikes' : 'Manage Users and Strikes'}</h2>
                        </div>

                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <span className={styles.colTitle}>{t('colName')}</span>
                                <span className={styles.colType}>Rol</span>
                                <span className={styles.colWorldview}>Strikes</span>
                                <span className={styles.colActions}>{t('colActions')}</span>
                            </div>
                            {users.map((u) => (
                                <div key={u.id} className={styles.tableRow}>
                                    <span className={styles.colTitle}>
                                        {u.display_name || 'Anonymous'}
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{u.id}</div>
                                    </span>
                                    <span className={styles.colType}>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-alert' : u.role === 'moderator' ? 'badge-primary' : 'badge-sage'}`}>
                                            {u.role || 'user'}
                                        </span>
                                    </span>
                                    <span className={styles.colWorldview}>
                                        <span className={`badge ${u.strikes >= 3 ? 'badge-alert' : u.strikes > 0 ? 'badge-warm' : 'badge-calm'}`}>
                                            {u.strikes || 0}
                                        </span>
                                    </span>
                                    <span className={styles.colActions}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={async () => {
                                                await fetch(`/api/admin/users/${u.id}/strikes`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'increment' })
                                                });
                                                loadUsers();
                                            }}
                                            title="Add Strike"
                                        >
                                            + Strike
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ marginLeft: '4px' }}
                                            onClick={async () => {
                                                await fetch(`/api/admin/users/${u.id}/strikes`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'decrement' })
                                                });
                                                loadUsers();
                                            }}
                                            title="Remove Strike"
                                            disabled={!u.strikes || u.strikes === 0}
                                        >
                                            - Strike
                                        </button>
                                    </span>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className={styles.emptyRow}>{t('noItems')}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab (Admin only) */}
                {tab === 'settings' && isAdmin && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>⚙️ {t('manageSettings')}</h2>
                        </div>

                        <div className={styles.reviewCard}>
                            <div className={styles.reviewCardHeader}>
                                <div>
                                    <h3>{t('aiProvider')}</h3>
                                    <p className={styles.reviewCardDesc}>{t('aiProviderDesc')}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                <button
                                    className={`btn ${settings.active_ai_provider === 'openai' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleToggleAIProvider('openai')}
                                    disabled={savingSettings}
                                >
                                    {settings.active_ai_provider === 'openai' ? '✓ ' : ''} ChatGPT (OpenAI)
                                </button>
                                <button
                                    className={`btn ${settings.active_ai_provider === 'gemini' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleToggleAIProvider('gemini')}
                                    disabled={savingSettings}
                                >
                                    {settings.active_ai_provider === 'gemini' ? '✓ ' : ''} Gemini (Google)
                                </button>
                            </div>
                        </div>

                        {/* Moderation toggles */}
                        <div className={styles.reviewCard} style={{ marginTop: 'var(--space-lg)' }}>
                            <h3>🤖 {locale === 'es' ? 'Moderación de IA' : 'AI Moderation'}</h3>
                            <p className={styles.reviewCardDesc}>
                                {locale === 'es'
                                    ? 'Controla qué tipos de contenido son revisados automáticamente por agentes de IA.'
                                    : 'Control which content types are automatically reviewed by AI agents.'}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                {/* Resources moderation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                            📚 {locale === 'es' ? 'Moderación de Recursos' : 'Resource Moderation'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {locale === 'es' ? 'Revisar automáticamente recursos enviados por usuarios' : 'Auto-review user-submitted resources'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_resources_enabled !== false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_resources_enabled', true)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_resources_enabled !== false ? '✓ ' : ''}{locale === 'es' ? 'Activo' : 'On'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_resources_enabled === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_resources_enabled', false)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_resources_enabled === false ? '✓ ' : ''}{locale === 'es' ? 'Inactivo' : 'Off'}
                                        </button>
                                    </div>
                                </div>
                                {/* Reviews moderation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                            💬 {locale === 'es' ? 'Moderación de Reseñas' : 'Review Moderation'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {locale === 'es' ? 'Revisar automáticamente reseñas enviadas por usuarios' : 'Auto-review user-submitted comments'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_reviews_enabled !== false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_reviews_enabled', true)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_reviews_enabled !== false ? '✓ ' : ''}{locale === 'es' ? 'Activo' : 'On'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_reviews_enabled === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_reviews_enabled', false)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_reviews_enabled === false ? '✓ ' : ''}{locale === 'es' ? 'Inactivo' : 'Off'}
                                        </button>
                                    </div>
                                </div>
                                {/* Chat moderation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                            🗣️ {locale === 'es' ? 'Moderación de Chats' : 'Chat Moderation'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {locale === 'es'
                                                ? 'Filtrar mensajes inapropiados en salas comunitarias antes de que se guarden'
                                                : 'Filter inappropriate messages in community rooms before they are saved'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_chat_enabled !== false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_chat_enabled', true)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_chat_enabled !== false ? '✓ ' : ''}{locale === 'es' ? 'Activo' : 'On'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_chat_enabled === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_chat_enabled', false)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_chat_enabled === false ? '✓ ' : ''}{locale === 'es' ? 'Inactivo' : 'Off'}
                                        </button>
                                    </div>
                                </div>
                                {/* Therapist moderation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                            🩺 {locale === 'es' ? 'Pre-screening de Terapeutas' : 'Therapist Pre-screening'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {locale === 'es'
                                                ? 'La IA analiza terapeutas enviados por usuarios y genera un resumen para el admin'
                                                : 'AI analyzes user-submitted therapists and generates a summary for the admin to review'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_therapists_enabled !== false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_therapists_enabled', true)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_therapists_enabled !== false ? '✓ ' : ''}{locale === 'es' ? 'Activo' : 'On'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_therapists_enabled === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_therapists_enabled', false)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_therapists_enabled === false ? '✓ ' : ''}{locale === 'es' ? 'Inactivo' : 'Off'}
                                        </button>
                                    </div>
                                </div>
                                {/* Journal moderation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                            📔 {locale === 'es' ? 'Moderación de Diarios' : 'Journal Moderation'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {locale === 'es'
                                                ? 'Revisión automática con IA de entradas de diario antes de publicarse en la comunidad'
                                                : 'AI pre-screening of journal entries before they appear in the community section'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_journal_enabled !== false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_journal_enabled', true)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_journal_enabled !== false ? '✓ ' : ''}{locale === 'es' ? 'Activo' : 'On'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_journal_enabled === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_journal_enabled', false)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_journal_enabled === false ? '✓ ' : ''}{locale === 'es' ? 'Inactivo' : 'Off'}
                                        </button>
                                    </div>
                                </div>
                                {/* Letters moderation */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                                            💌 {locale === 'es' ? 'Moderación de Cartas' : 'Letter Moderation'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {locale === 'es'
                                                ? 'Revisión automática con IA de cartas antes de publicarse en la comunidad'
                                                : 'AI pre-screening of community letters before they appear publicly'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_letters_enabled !== false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_letters_enabled', true)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_letters_enabled !== false ? '✓ ' : ''}{locale === 'es' ? 'Activo' : 'On'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${settings.moderation_letters_enabled === false ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleToggleSetting('moderation_letters_enabled', false)}
                                            disabled={savingSettings}
                                        >
                                            {settings.moderation_letters_enabled === false ? '✓ ' : ''}{locale === 'es' ? 'Inactivo' : 'Off'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Volunteers Tab */}
                {tab === 'volunteers' && isAdmin && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>🤝 {locale === 'es' ? 'Gestión de Voluntarios' : 'Volunteer Management'}</h2>
                        </div>

                        {/* Sub-tabs */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-md)' }}>
                            {['applications', 'calendar'].map((st) => (
                                <button
                                    key={st}
                                    className={`btn btn-sm ${volSubTab === st ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setVolSubTab(st)}
                                >
                                    {st === 'applications'
                                        ? (locale === 'es' ? '📋 Solicitudes' : '📋 Applications')
                                        : (locale === 'es' ? '📅 Calendario de Turnos' : '📅 Shift Calendar')}
                                </button>
                            ))}
                        </div>

                        {/* Applications sub-tab */}
                        {volSubTab === 'applications' && (
                            <div>
                                {volunteers.length === 0 ? (
                                    <div className={styles.emptyReview}>
                                        <span className={styles.emptyIcon}>🤝</span>
                                        <p>{locale === 'es' ? 'No hay solicitudes de voluntarios aún.' : 'No volunteer applications yet.'}</p>
                                    </div>
                                ) : (
                                    <div className={styles.reviewList}>
                                        {volunteers.map((v) => (
                                            <div key={v.id} className={styles.reviewCard}>
                                                <div className={styles.reviewCardHeader}>
                                                    <div>
                                                        <h3>{v.name}</h3>
                                                        <div className={styles.reviewCardMeta}>
                                                            <a href={`mailto:${v.email}`} style={{ color: 'var(--accent-primary)', fontSize: 'var(--font-size-sm)' }}>{v.email}</a>
                                                            <span className={v.status === 'approved' ? 'badge badge-calm' : v.status === 'rejected' ? 'badge badge-alert' : 'badge badge-warm'}>
                                                                {v.status === 'approved' ? (locale === 'es' ? 'Aprobado' : 'Approved')
                                                                    : v.status === 'rejected' ? (locale === 'es' ? 'Rechazado' : 'Rejected')
                                                                    : (locale === 'es' ? 'Pendiente' : 'Pending')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {v.motivation && (
                                                    <p className={styles.reviewCardDesc}><strong>{locale === 'es' ? 'Motivación: ' : 'Motivation: '}</strong>{v.motivation}</p>
                                                )}
                                                {v.availability_notes && (
                                                    <p className={styles.reviewCardDesc} style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                                        🕐 {v.availability_notes}
                                                    </p>
                                                )}
                                                {v.status === 'pending' && (
                                                    <div className={styles.reviewCardActions}>
                                                        <button className="btn btn-primary btn-sm" onClick={() => handleVolunteerApprove(v.id)}>
                                                            ✓ {locale === 'es' ? 'Aprobar' : 'Approve'}
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setVolRejectModal(v.id); setVolRejectReason(''); }}>
                                                            ✗ {locale === 'es' ? 'Rechazar' : 'Reject'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Calendar sub-tab */}
                        {volSubTab === 'calendar' && currentWeekStr && (() => {
                            const monday = getMondayOfWeek(currentWeekStr);
                            const days = Array.from({ length: 7 }, (_, i) => {
                                const d = new Date(monday);
                                d.setDate(monday.getDate() + i);
                                return d;
                            });
                            const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8..21

                            const dayNames = locale === 'es'
                                ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
                                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                            const getShiftForCell = (day, hour) => {
                                return volunteerShifts.filter(s => {
                                    const start = new Date(s.start_time);
                                    const end = new Date(s.end_time);
                                    return start.toDateString() === day.toDateString()
                                        && start.getHours() <= hour
                                        && end.getHours() > hour
                                        && s.status !== 'cancelled';
                                });
                            };

                            const isFirstHour = (shift, hour) => new Date(shift.start_time).getHours() === hour;

                            // Compliance stats per volunteer
                            const volStats = {};
                            volunteerShifts.forEach(s => {
                                const name = s.volunteer_applications?.name || '?';
                                if (!volStats[name]) volStats[name] = { total: 0, met: 0, late: 0, missed: 0 };
                                const now = new Date();
                                const end = new Date(s.end_time);
                                if (now <= end) return; // skip future
                                volStats[name].total++;
                                const checkin = s.volunteer_checkins?.[0];
                                if (!checkin) { volStats[name].missed++; return; }
                                const start = new Date(s.start_time);
                                const late = (new Date(checkin.checked_in_at) - start) > 15 * 60 * 1000;
                                if (late) volStats[name].late++; else volStats[name].met++;
                            });

                            return (
                                <div>
                                    {/* Week navigation */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => navigateWeek(-1)}>← {locale === 'es' ? 'Anterior' : 'Prev'}</button>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                                            {days[0].toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'short' })}
                                            {' – '}
                                            {days[6].toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <button className="btn btn-secondary btn-sm" onClick={() => navigateWeek(1)}>{locale === 'es' ? 'Siguiente' : 'Next'} →</button>
                                        <button className="btn btn-primary btn-sm" onClick={() => setShiftModal({ mode: 'create' })}>
                                            + {locale === 'es' ? 'Nuevo turno' : 'New shift'}
                                        </button>
                                    </div>

                                    {/* Calendar grid */}
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '48px', padding: '6px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 400 }}></th>
                                                    {days.map((d, i) => (
                                                        <th key={i} style={{
                                                            padding: '6px 4px',
                                                            textAlign: 'center',
                                                            color: d.toDateString() === new Date().toDateString() ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                            fontWeight: 600,
                                                            borderBottom: '1px solid var(--border-light)',
                                                        }}>
                                                            {dayNames[i]}<br />
                                                            <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                                                                {d.getDate()}/{d.getMonth() + 1}
                                                            </span>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {hours.map((hour) => (
                                                    <tr key={hour}>
                                                        <td style={{ padding: '2px 6px 2px 0', textAlign: 'right', color: 'var(--text-muted)', verticalAlign: 'top', paddingTop: '4px' }}>
                                                            {String(hour).padStart(2, '0')}:00
                                                        </td>
                                                        {days.map((day, di) => {
                                                            const shifts = getShiftForCell(day, hour);
                                                            return (
                                                                <td key={di} style={{
                                                                    border: '1px solid var(--border-light)',
                                                                    height: '40px',
                                                                    verticalAlign: 'top',
                                                                    padding: '2px',
                                                                    background: day.toDateString() === new Date().toDateString() ? 'rgba(51,149,255,0.04)' : 'transparent',
                                                                    cursor: shifts.length === 0 ? 'pointer' : 'default',
                                                                }}
                                                                    onClick={() => {
                                                                        if (shifts.length === 0) {
                                                                            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                                                            setShiftForm(prev => ({ ...prev, date: dateStr, start_hour: String(hour).padStart(2, '0'), end_hour: String(hour + 1).padStart(2, '0') }));
                                                                            setShiftModal({ mode: 'create' });
                                                                        }
                                                                    }}
                                                                >
                                                                    {shifts.map(s => isFirstHour(s, hour) && (
                                                                        <div key={s.id}
                                                                            onClick={(e) => { e.stopPropagation(); setShiftModal({ mode: 'view', shift: s }); }}
                                                                            style={{
                                                                                background: s.volunteer_checkins?.[0] ? 'rgba(0,229,184,0.15)' : 'rgba(51,149,255,0.15)',
                                                                                border: `1px solid ${s.volunteer_checkins?.[0] ? 'var(--accent-calm)' : 'var(--accent-primary)'}`,
                                                                                borderRadius: '4px',
                                                                                padding: '2px 4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '10px',
                                                                                lineHeight: '1.3',
                                                                            }}>
                                                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {s.volunteer_applications?.name || '?'}
                                                                            </div>
                                                                            {shiftComplianceBadge(s)}
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Compliance stats */}
                                    {Object.keys(volStats).length > 0 && (
                                        <div style={{ marginTop: 'var(--space-xl)' }}>
                                            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                                                {locale === 'es' ? '📊 Estadísticas de cumplimiento (semana)' : '📊 Compliance stats (week)'}
                                            </h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                                                {Object.entries(volStats).map(([name, st]) => (
                                                    <div key={name} style={{
                                                        background: 'var(--bg-elevated)',
                                                        border: '1px solid var(--border-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: 'var(--space-sm) var(--space-md)',
                                                        fontSize: 'var(--font-size-xs)',
                                                    }}>
                                                        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{name}</div>
                                                        <div style={{ color: 'var(--text-muted)' }}>
                                                            ✅ {st.met} · ⚠️ {st.late} · ❌ {st.missed} / {st.total}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Shift Modal */}
                {shiftModal && (
                    <div className={styles.overlay} onClick={() => setShiftModal(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                            {shiftModal.mode === 'create' ? (
                                <>
                                    <h2>📅 {locale === 'es' ? 'Nuevo Turno' : 'New Shift'}</h2>
                                    <div className={styles.modalBody}>
                                        <div className="form-group">
                                            <label className="form-label">{locale === 'es' ? 'Voluntario' : 'Volunteer'}</label>
                                            <select
                                                className="form-input form-select"
                                                value={shiftForm.volunteer_id}
                                                onChange={(e) => setShiftForm(prev => ({ ...prev, volunteer_id: e.target.value }))}
                                            >
                                                <option value="">{locale === 'es' ? '— Seleccionar —' : '— Select —'}</option>
                                                {volunteers.filter(v => v.status === 'approved').map(v => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{locale === 'es' ? 'Fecha' : 'Date'}</label>
                                            <input type="date" className="form-input" value={shiftForm.date} onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div className="form-group">
                                                <label className="form-label">{locale === 'es' ? 'Hora inicio' : 'Start hour'}</label>
                                                <select className="form-input form-select" value={shiftForm.start_hour} onChange={(e) => setShiftForm(prev => ({ ...prev, start_hour: e.target.value }))}>
                                                    {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                                                        <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}:00</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{locale === 'es' ? 'Hora fin' : 'End hour'}</label>
                                                <select className="form-input form-select" value={shiftForm.end_hour} onChange={(e) => setShiftForm(prev => ({ ...prev, end_hour: e.target.value }))}>
                                                    {Array.from({ length: 16 }, (_, i) => i + 8).map(h => (
                                                        <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}:00</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{locale === 'es' ? 'Notas (opcional)' : 'Notes (optional)'}</label>
                                            <textarea className="form-input form-textarea" rows={2} value={shiftForm.notes} onChange={(e) => setShiftForm(prev => ({ ...prev, notes: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button className="btn btn-sm" onClick={() => setShiftModal(null)}>{t('cancel')}</button>
                                        <button className="btn btn-primary btn-sm" onClick={handleCreateShift}>
                                            {locale === 'es' ? 'Crear turno' : 'Create shift'}
                                        </button>
                                    </div>
                                </>
                            ) : shiftModal.shift ? (
                                <>
                                    <h2>📅 {locale === 'es' ? 'Detalle del turno' : 'Shift details'}</h2>
                                    <div className={styles.modalBody}>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                            <strong>{locale === 'es' ? 'Voluntario: ' : 'Volunteer: '}</strong>{shiftModal.shift.volunteer_applications?.name}
                                        </p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                            <strong>{locale === 'es' ? 'Horario: ' : 'Time: '}</strong>
                                            {new Date(shiftModal.shift.start_time).toLocaleString(locale === 'es' ? 'es-CL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            {' → '}
                                            {new Date(shiftModal.shift.end_time).toLocaleTimeString(locale === 'es' ? 'es-CL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)' }}>
                                            <strong>{locale === 'es' ? 'Estado: ' : 'Status: '}</strong>
                                            {shiftComplianceBadge(shiftModal.shift)}
                                        </p>
                                        {shiftModal.shift.notified_at && (
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                {locale === 'es' ? 'Notificado: ' : 'Notified: '}
                                                {new Date(shiftModal.shift.notified_at).toLocaleString(locale === 'es' ? 'es-CL' : 'en-US')}
                                            </p>
                                        )}
                                        {shiftModal.shift.volunteer_checkins?.[0] && (
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                ✅ Check-in: {new Date(shiftModal.shift.volunteer_checkins[0].checked_in_at).toLocaleTimeString(locale === 'es' ? 'es-CL' : 'en-US')}
                                                {shiftModal.shift.volunteer_checkins[0].checked_out_at && (
                                                    <> · Check-out: {new Date(shiftModal.shift.volunteer_checkins[0].checked_out_at).toLocaleTimeString(locale === 'es' ? 'es-CL' : 'en-US')}</>
                                                )}
                                            </p>
                                        )}
                                        {shiftModal.shift.notes && (
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>{shiftModal.shift.notes}</p>
                                        )}
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button className="btn btn-sm" onClick={() => setShiftModal(null)}>{t('cancel')}</button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleCancelShift(shiftModal.shift.id)}
                                        >
                                            ✗ {locale === 'es' ? 'Cancelar turno' : 'Cancel shift'}
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            disabled={sendingNotification === shiftModal.shift.id}
                                            onClick={() => handleNotifyShift(shiftModal.shift.id)}
                                        >
                                            {sendingNotification === shiftModal.shift.id ? '...' : `✉️ ${locale === 'es' ? 'Notificar' : 'Notify'}`}
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Volunteer Reject Modal */}
                {volRejectModal && (
                    <div className={styles.overlay} onClick={() => setVolRejectModal(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                            <h2>✗ {locale === 'es' ? 'Rechazar solicitud' : 'Reject application'}</h2>
                            <div className={styles.modalBody}>
                                <div className="form-group">
                                    <label className="form-label">{t('rejectionReason')}</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={volRejectReason}
                                        onChange={(e) => setVolRejectReason(e.target.value)}
                                        placeholder={t('rejectionReasonPlaceholder')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className="btn btn-sm" onClick={() => setVolRejectModal(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary btn-sm" onClick={handleVolunteerReject}>
                                    {t('confirmReject')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Journal Reject Modal */}
                {journalRejectModal && (
                    <div className={styles.overlay} onClick={() => setJournalRejectModal(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                            <h2>✗ {locale === 'es' ? 'Rechazar entrada de diario' : 'Reject journal entry'}</h2>
                            <div className={styles.modalBody}>
                                <div className="form-group">
                                    <label className="form-label">{t('rejectionReason')}</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={journalRejectReason}
                                        onChange={(e) => setJournalRejectReason(e.target.value)}
                                        placeholder={t('rejectionReasonPlaceholder')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className="btn btn-sm" onClick={() => setJournalRejectModal(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary btn-sm" onClick={async () => {
                                    await fetch(`/api/admin/journal/${journalRejectModal}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'rejected', rejection_reason: journalRejectReason }),
                                    });
                                    setJournalRejectModal(null);
                                    setJournalRejectReason('');
                                    loadPendingJournals();
                                }}>
                                    {t('confirmReject')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Letter Reject Modal */}
                {letterRejectModal && (
                    <div className={styles.overlay} onClick={() => setLetterRejectModal(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                            <h2>✗ {locale === 'es' ? 'Rechazar carta' : 'Reject letter'}</h2>
                            <div className={styles.modalBody}>
                                <div className="form-group">
                                    <label className="form-label">{t('rejectionReason')}</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={letterRejectReason}
                                        onChange={(e) => setLetterRejectReason(e.target.value)}
                                        placeholder={t('rejectionReasonPlaceholder')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className="btn btn-sm" onClick={() => setLetterRejectModal(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary btn-sm" onClick={async () => {
                                    await fetch(`/api/admin/letters/${letterRejectModal}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'rejected', rejection_reason: letterRejectReason }),
                                    });
                                    setLetterRejectModal(null);
                                    setLetterRejectReason('');
                                    loadPendingLetters();
                                }}>
                                    {t('confirmReject')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit/Add Modal */}
                {modal && (
                    <div className={styles.overlay} onClick={() => setModal(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <h2>{modal.mode === 'add' ? t('add') : t('edit')} {modal.type === 'resource' ? t('resourcesTab') : t('therapistsTab')}</h2>

                            <div className={styles.modalBody}>
                                {modal.type === 'resource' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">{t('colTitle')}</label>
                                            <input className="form-input" value={form.title} onChange={(e) => updateForm('title', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formDescription')}</label>
                                            <textarea className="form-input form-textarea" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formType')}</label>
                                            <select className="form-input form-select" value={form.type} onChange={(e) => updateForm('type', e.target.value)}>
                                                {resourceTypes.map(rt => <option key={rt} value={rt}>{tRes(`types.${rt}`)}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formWorldview')}</label>
                                            <select className="form-input form-select" value={form.worldview} onChange={(e) => updateForm('worldview', e.target.value)}>
                                                {worldviews.map(wv => <option key={wv} value={wv}>{tRes(`worldviews.${wv}`)}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formAuthor')}</label>
                                            <input className="form-input" value={form.author_or_creator} onChange={(e) => updateForm('author_or_creator', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formFocus')}</label>
                                            <input className="form-input" value={form.focus_theme} onChange={(e) => updateForm('focus_theme', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formAvailability')}</label>
                                            <input className="form-input" value={form.availability} onChange={(e) => updateForm('availability', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formExternalUrl')}</label>
                                            <input className="form-input" value={form.external_url} onChange={(e) => updateForm('external_url', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tRes('formCoverUrl')}</label>
                                            <input className="form-input" value={form.cover_url} onChange={(e) => updateForm('cover_url', e.target.value)} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">{t('colName')}</label>
                                            <input className="form-input" value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('fieldTitle')}</label>
                                            <input className="form-input" value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Lic., Dr., etc." />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('fieldBio')}</label>
                                            <textarea className="form-input form-textarea" value={form.bio} onChange={(e) => updateForm('bio', e.target.value)} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div className="form-group">
                                                <label className="form-label">{t('fieldCity')}</label>
                                                <input className="form-input" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('fieldCountry')}</label>
                                                <input className="form-input" value={form.country} onChange={(e) => updateForm('country', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tTher('modality')}</label>
                                            <select className="form-input form-select" value={form.modality} onChange={(e) => updateForm('modality', e.target.value)}>
                                                <option value="in_person">{tTher('modalities.in_person')}</option>
                                                <option value="online">{tTher('modalities.online')}</option>
                                                <option value="both">{tTher('modalities.both')}</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div className="form-group">
                                                <label className="form-label">{tTher('email')}</label>
                                                <input className="form-input" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{tTher('phone')}</label>
                                                <input className="form-input" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tTher('website')}</label>
                                            <input className="form-input" value={form.website} onChange={(e) => updateForm('website', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tTher('linkedin')}</label>
                                            <input className="form-input" value={form.linkedin_url} onChange={(e) => updateForm('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tTher('credentials')}</label>
                                            <input className="form-input" value={form.credentials_url} onChange={(e) => updateForm('credentials_url', e.target.value)} placeholder="https://..." />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('fieldLanguages')}</label>
                                            <input className="form-input" value={form.languages} onChange={(e) => updateForm('languages', e.target.value)} placeholder="en, es, pt" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('fieldSpecializations')}</label>
                                            <input className="form-input" value={form.specializations} onChange={(e) => updateForm('specializations', e.target.value)} placeholder="grief_counseling, trauma, cbt" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{tTher('license')}</label>
                                            <input className="form-input" value={form.license_number} onChange={(e) => updateForm('license_number', e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <input type="checkbox" id="verified" checked={form.is_verified} onChange={(e) => updateForm('is_verified', e.target.checked)} />
                                            <label htmlFor="verified" style={{ fontSize: 'var(--font-size-sm)' }}>{t('fieldVerified')}</label>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                <button className="btn btn-sm" onClick={() => setModal(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                    {saving ? '...' : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Reason Modal */}
                {rejectModal && (
                    <div className={styles.overlay} onClick={() => setRejectModal(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                            <h2>✗ {t('reject')}</h2>
                            <div className={styles.modalBody}>
                                <div className="form-group">
                                    <label className="form-label">{t('rejectionReason')}</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder={t('rejectionReasonPlaceholder')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className="btn btn-sm" onClick={() => setRejectModal(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary btn-sm" onClick={handleReject}>
                                    {t('confirmReject')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

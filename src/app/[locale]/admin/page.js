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
    const [therapists, setTherapists] = useState([]);

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
            if (data.isAdmin) {
                loadResources();
                loadTherapists();
                loadSettings();
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale, router]);

    const handleToggleAIProvider = async (provider) => {
        setSavingSettings(true);
        // Optimistic update
        setSettings(prev => ({ ...prev, active_ai_provider: provider }));

        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'active_ai_provider', value: provider }),
        });

        setSavingSettings(false);
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
                        📋 {t('reviewTab')} ({pendingResources.length + pendingComments.length})
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
                            className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`}
                            onClick={() => setTab('settings')}
                        >
                            ⚙️ {t('settingsTab')}
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

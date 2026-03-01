'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from '../journal.module.css';

const RichEditor = dynamic(() => import('@/components/journal/RichEditor'), { ssr: false });

const LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
const WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];
const EMOTIONS = ['sadness','anger','nostalgia','gratitude','confusion','hope','peace','other'];
const GRIEF_STAGES = ['denial','anger','bargaining','depression','acceptance'];
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function JournalEntryPage({ params: paramsPromise }) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingPublic, setTogglingPublic] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [id, setId] = useState(null);

    // Edit state
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editLossType, setEditLossType] = useState('');
    const [editWorldview, setEditWorldview] = useState('');
    const [editEmotion, setEditEmotion] = useState('');
    const [editGriefStage, setEditGriefStage] = useState('');

    useEffect(() => {
        paramsPromise.then(p => setId(p.id));
    }, [paramsPromise]);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            const res = await fetch(`/api/journal/${id}`);
            if (!res.ok) { setLoading(false); return; }
            const { entry } = await res.json();
            setEntry(entry);
            setEditTitle(entry.title || '');
            setEditContent(entry.content || '');
            setEditLossType(entry.loss_type || '');
            setEditWorldview(entry.worldview || '');
            setEditEmotion(entry.emotion || '');
            setEditGriefStage(entry.grief_stage || '');
            setLoading(false);
        };
        load();
    }, [id]);

    const lossLabels = { parent: es ? 'Padre/madre' : 'Parent', child: es ? 'Hijo/a' : 'Child', partner: es ? 'Pareja' : 'Partner', sibling: es ? 'Hermano/a' : 'Sibling', friend: es ? 'Amigo/a' : 'Friend', pet: es ? 'Mascota' : 'Pet', other: es ? 'Otro' : 'Other', general: es ? 'General' : 'General' };
    const worldviewLabels = { secular: 'Secular', spiritual: es ? 'Espiritual' : 'Spiritual', christian: es ? 'Cristiano' : 'Christian', jewish: es ? 'Judío' : 'Jewish', muslim: es ? 'Musulmán' : 'Muslim', buddhist: es ? 'Budista' : 'Buddhist', hindu: es ? 'Hindú' : 'Hindu', universal: 'Universal' };
    const emotionLabels = { sadness: es ? 'Tristeza 😢' : 'Sadness 😢', anger: es ? 'Enojo 😠' : 'Anger 😠', nostalgia: es ? 'Nostalgia 🥹' : 'Nostalgia 🥹', gratitude: es ? 'Gratitud 🙏' : 'Gratitude 🙏', confusion: es ? 'Confusión 😵' : 'Confusion 😵', hope: es ? 'Esperanza ✨' : 'Hope ✨', peace: es ? 'Paz 🌿' : 'Peace 🌿', other: es ? 'Otro 💭' : 'Other 💭' };
    const griefLabels = { denial: es ? 'Negación 🙈' : 'Denial 🙈', anger: es ? 'Ira 🔥' : 'Anger 🔥', bargaining: es ? 'Negociación 🙏' : 'Bargaining 🙏', depression: es ? 'Depresión 🌧️' : 'Depression 🌧️', acceptance: es ? 'Aceptación 🌱' : 'Acceptance 🌱' };

    const handleSave = async () => {
        if (!editContent.replace(/<[^>]*>/g, '').trim()) {
            setError(es ? 'El contenido no puede estar vacío.' : 'Content cannot be empty.');
            return;
        }
        setSaving(true); setError('');
        const res = await fetch(`/api/journal/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, content: editContent, loss_type: editLossType, worldview: editWorldview, emotion: editEmotion, grief_stage: editGriefStage }),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) { setError(data.error || (es ? 'Error al guardar.' : 'Error saving.')); return; }
        setEntry(data.entry);
        setEditing(false);
    };

    const handleTogglePublic = async () => {
        setTogglingPublic(true); setError('');
        const newPublic = !entry.is_public;
        const res = await fetch(`/api/journal/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public: newPublic }),
        });
        const data = await res.json();
        setTogglingPublic(false);
        if (!res.ok) { setError(data.error || 'Error'); return; }
        setEntry(data.entry);
    };

    const handleDelete = async () => {
        if (!confirm(es ? '¿Eliminar esta entrada?' : 'Delete this entry?')) return;
        setDeleting(true);
        await fetch(`/api/journal/${id}`, { method: 'DELETE' });
        router.push(`/${locale}/journal`);
    };

    const moderationBadge = () => {
        if (!entry.is_public || entry.moderation_status === 'private') return null;
        if (entry.moderation_status === 'pending') return <span className={`${styles.statusBadge} ${styles.statusPending}`}>{es ? '⏳ En revisión' : '⏳ In review'}</span>;
        if (entry.moderation_status === 'approved') return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>{es ? '✅ Pública' : '✅ Public'}</span>;
        if (entry.moderation_status === 'rejected') return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>{es ? '❌ Rechazada' : '❌ Rejected'}</span>;
        return null;
    };

    if (loading) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>...</div>;
    if (!entry) return (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>{es ? 'Entrada no encontrada.' : 'Entry not found.'}</p>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/${locale}/journal`)}>← {es ? 'Volver' : 'Back'}</button>
        </div>
    );

    return (
        <div className={styles.detailPage}>
            <div className={styles.detailHeader}>
                <button className={styles.backBtn} onClick={() => router.push(`/${locale}/journal`)}>
                    ← {es ? 'Mi Diario' : 'My Journal'}
                </button>
                <div className={styles.detailActions}>
                    {!editing && (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>{es ? 'Editar' : 'Edit'}</button>
                            <button className="btn btn-sm" style={{ color: 'var(--accent-alert)', background: 'none', border: '1px solid var(--accent-alert)' }} onClick={handleDelete} disabled={deleting}>
                                {deleting ? '...' : (es ? 'Eliminar' : 'Delete')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div style={{ color: 'var(--accent-alert)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>{error}</div>}

            {!editing ? (
                <>
                    <h1 className={styles.detailTitle}>{entry.title || (es ? 'Sin título' : 'Untitled')}</h1>
                    <div className={styles.detailMeta}>
                        <span className={styles.detailDate}>{formatDate(entry.created_at, locale)}</span>
                        {moderationBadge()}
                        {entry.emotion && <span className={styles.tag}>{emotionLabels[entry.emotion] || entry.emotion}</span>}
                        {entry.grief_stage && <span className={styles.tag}>{griefLabels[entry.grief_stage] || entry.grief_stage}</span>}
                        {entry.loss_type && <span className={styles.tag}>{lossLabels[entry.loss_type] || entry.loss_type}</span>}
                    </div>

                    <div className={styles.detailContent} dangerouslySetInnerHTML={{ __html: entry.content }} />

                    {/* Public toggle */}
                    <div className={styles.publicToggle}>
                        <div className={styles.toggleLabel}>
                            <strong>{es ? 'Compartir en Diarios de la Comunidad' : 'Share in Community Journals'}</strong>
                            <br />
                            <small style={{ color: 'var(--text-muted)' }}>
                                {es
                                    ? 'Tu entrada pasará por una revisión antes de ser visible.'
                                    : 'Your entry will go through a review before becoming visible.'}
                            </small>
                        </div>
                        {togglingPublic ? (
                            <div className={styles.toggleLoading}>
                                <span className={styles.spinner} />
                                {es ? 'Procesando...' : 'Processing...'}
                            </div>
                        ) : (
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={entry.is_public || false}
                                    onChange={handleTogglePublic}
                                />
                                <span className={styles.toggleSlider} />
                            </label>
                        )}
                    </div>

                    {entry.moderation_status === 'rejected' && entry.moderation_rejection_reason && (
                        <div className={styles.rejectionNote}>
                            <strong>{es ? 'Razón del rechazo: ' : 'Rejection reason: '}</strong>
                            {entry.moderation_rejection_reason}
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.form}>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Título (opcional)' : 'Title (optional)'}</label>
                        <input type="text" className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Contenido' : 'Content'} *</label>
                        <RichEditor value={editContent} onChange={setEditContent} />
                    </div>
                    <div className={styles.formTagsGrid}>
                        <div className="form-group">
                            <label className="form-label">{es ? 'Tipo de pérdida' : 'Type of loss'}</label>
                            <select className="form-input" value={editLossType} onChange={e => setEditLossType(e.target.value)}>
                                <option value="">—</option>
                                {LOSS_TYPES.map(k => <option key={k} value={k}>{lossLabels[k]}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{es ? 'Cosmovisión' : 'Worldview'}</label>
                            <select className="form-input" value={editWorldview} onChange={e => setEditWorldview(e.target.value)}>
                                <option value="">—</option>
                                {WORLDVIEWS.map(k => <option key={k} value={k}>{worldviewLabels[k]}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{es ? 'Emoción' : 'Emotion'}</label>
                            <select className="form-input" value={editEmotion} onChange={e => setEditEmotion(e.target.value)}>
                                <option value="">—</option>
                                {EMOTIONS.map(k => <option key={k} value={k}>{emotionLabels[k]}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{es ? 'Etapa del duelo' : 'Grief stage'}</label>
                            <select className="form-input" value={editGriefStage} onChange={e => setEditGriefStage(e.target.value)}>
                                <option value="">—</option>
                                {GRIEF_STAGES.map(k => <option key={k} value={k}>{griefLabels[k]}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button className="btn btn-secondary" onClick={() => setEditing(false)}>{es ? 'Cancelar' : 'Cancel'}</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '...' : (es ? 'Guardar' : 'Save')}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../letters.module.css';

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr, locale) {
    const d = new Date(dateStr);
    const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function LetterDetailPage({ params: paramsPromise }) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [letter, setLetter] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [id, setId] = useState(null);
    const [authed, setAuthed] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [commentError, setCommentError] = useState('');

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
        paramsPromise.then(p => setId(p.id));
    }, [paramsPromise]);

    useEffect(() => {
        const check = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setAuthed(!!user);
        };
        check();
    }, []);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            const res = await fetch(`/api/letters/${id}`);
            if (!res.ok) { setLoading(false); return; }
            const data = await res.json();
            setLetter(data.letter);
            setComments(data.comments || []);
            setLoading(false);
        };
        load();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm(es ? '¿Eliminar esta carta?' : 'Delete this letter?')) return;
        setDeleting(true);
        await fetch(`/api/letters/${id}`, { method: 'DELETE' });
        router.push(`/${locale}/letters`);
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        setSubmittingComment(true); setCommentError('');
        const res = await fetch(`/api/letters/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newComment }),
        });
        const data = await res.json();
        setSubmittingComment(false);
        if (!res.ok) { setCommentError(data.error || 'Error'); return; }
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
    };

    const moderationBadge = () => {
        if (!letter) return null;
        if (letter.moderation_status === 'pending') return <span className={`${styles.statusBadge} ${styles.statusPending}`}>{es ? '⏳ En revisión' : '⏳ In review'}</span>;
        if (letter.moderation_status === 'approved') return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>{es ? '✅ Pública' : '✅ Public'}</span>;
        if (letter.moderation_status === 'rejected') return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>{es ? '❌ Rechazada' : '❌ Rejected'}</span>;
        return null;
    };

    if (loading) return <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>...</div>;
    if (!letter) return (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>{es ? 'Carta no encontrada.' : 'Letter not found.'}</p>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/${locale}/letters`)}>← {es ? 'Volver' : 'Back'}</button>
        </div>
    );

    return (
        <div className={styles.detailPage}>
            <div className={styles.detailHeader}>
                <button className={styles.backBtn} onClick={() => router.push(`/${locale}/letters`)}>
                    ← {es ? 'Cartas' : 'Letters'}
                </button>
                {letter.is_own && (
                    <div className={styles.detailActions}>
                        <button
                            className="btn btn-sm"
                            style={{ color: 'var(--accent-alert)', background: 'none', border: '1px solid var(--accent-alert)' }}
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? '...' : (es ? 'Eliminar' : 'Delete')}
                        </button>
                    </div>
                )}
            </div>

            {/* Own letter: show moderation status */}
            {letter.is_own && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    {moderationBadge()}
                </div>
            )}

            {/* Rejection reason */}
            {letter.is_own && letter.moderation_status === 'rejected' && letter.moderation_rejection_reason && (
                <div className={styles.rejectionNote}>
                    <strong>{es ? 'Razón del rechazo: ' : 'Rejection reason: '}</strong>
                    {letter.moderation_rejection_reason}
                </div>
            )}

            <div className={styles.letterContent}>
                <div
                    className={styles.letterBody}
                    dangerouslySetInnerHTML={{ __html: letter.content }}
                />
                <div className={styles.letterMeta}>
                    {letter.loss_type && <span className={styles.tag}>{lossLabels[letter.loss_type] || letter.loss_type}</span>}
                    {letter.worldview && <span className={styles.tag}>{worldviewLabels[letter.worldview] || letter.worldview}</span>}
                    <span className={styles.letterDate}>{formatDate(letter.created_at, locale)}</span>
                    {letter.author_name && (
                        <span className={styles.letterAuthor}>— {letter.author_name}</span>
                    )}
                </div>
            </div>

            {/* Comments */}
            {letter.moderation_status === 'approved' && (
                <div className={styles.commentsSection}>
                    <div className={styles.commentsHeader}>
                        💬 {es ? 'Comentarios' : 'Comments'} ({comments.length})
                    </div>

                    {comments.length > 0 && (
                        <div className={styles.commentsList}>
                            {comments.map(c => (
                                <div key={c.id} className={styles.comment}>
                                    <div className={styles.commentAuthor}>
                                        {c.author_name || (es ? 'Anónimo' : 'Anonymous')} · {formatDate(c.created_at, locale)}
                                    </div>
                                    <p className={styles.commentText}>{c.content}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {authed ? (
                        <>
                            <div className={styles.commentForm}>
                                <textarea
                                    className={styles.commentInput}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value.slice(0, 500))}
                                    placeholder={es ? 'Escribe un comentario...' : 'Write a comment...'}
                                    rows={2}
                                />
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleComment}
                                    disabled={submittingComment || !newComment.trim()}
                                >
                                    {submittingComment ? '...' : (es ? 'Enviar' : 'Send')}
                                </button>
                            </div>
                            <div className={styles.charCount}>{newComment.length}/500</div>
                            {commentError && <p style={{ color: 'var(--accent-alert)', fontSize: 'var(--font-size-xs)', padding: '0 var(--space-lg) var(--space-sm)' }}>{commentError}</p>}
                        </>
                    ) : (
                        <div style={{ padding: 'var(--space-md) var(--space-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/${locale}/auth/login`)}>
                                {es ? 'Inicia sesión para comentar' : 'Log in to comment'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

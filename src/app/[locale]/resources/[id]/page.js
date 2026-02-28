'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './resourceDetail.module.css';

const typeEmojis = {
    book: '📖', series: '📺', movie: '🎬', comic: '🦸', manga: '📕', song: '🎵', other: '📄',
};

export default function ResourceDetailPage() {
    const t = useTranslations('resources');
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const locale = pathname.split('/')[1] || 'en';
    const resourceId = params.id;

    const [resource, setResource] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [toast, setToast] = useState(null);

    // Review form
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reactions
    const [userReaction, setUserReaction] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [reacting, setReacting] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch resource
        const { data: res } = await supabase
            .from('resources')
            .select('*, resource_loss_types(loss_type), profiles!resources_created_by_fkey(display_name)')
            .eq('id', resourceId)
            .single();

        if (res) {
            setResource(res);
            setLikeCount(res.like_count || 0);
            setDislikeCount(res.dislike_count || 0);
        }

        // Fetch approved reviews
        const { data: revs } = await supabase
            .from('resource_reviews')
            .select('*, profiles(display_name)')
            .eq('resource_id', resourceId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        setReviews(revs || []);

        if (user) {
            // Check if user already reviewed
            const { data: myReview } = await supabase
                .from('resource_reviews')
                .select('id')
                .eq('resource_id', resourceId)
                .eq('user_id', user.id)
                .single();
            setHasReviewed(!!myReview);

            // Check user reaction
            const { data: reaction } = await supabase
                .from('resource_reactions')
                .select('reaction_type')
                .eq('resource_id', resourceId)
                .eq('user_id', user.id)
                .single();
            if (reaction) setUserReaction(reaction.reaction_type);
        }

        setLoading(false);
    }, [resourceId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleReaction = async (type) => {
        if (!user || reacting) return;
        setReacting(true);
        const supabase = createClient();

        if (userReaction === type) {
            await supabase.from('resource_reactions').delete()
                .eq('resource_id', resourceId).eq('user_id', user.id);
            setUserReaction(null);
            if (type === 'like') setLikeCount(c => Math.max(0, c - 1));
            else setDislikeCount(c => Math.max(0, c - 1));
        } else if (userReaction) {
            await supabase.from('resource_reactions').update({ reaction_type: type })
                .eq('resource_id', resourceId).eq('user_id', user.id);
            setUserReaction(type);
            if (type === 'like') { setLikeCount(c => c + 1); setDislikeCount(c => Math.max(0, c - 1)); }
            else { setDislikeCount(c => c + 1); setLikeCount(c => Math.max(0, c - 1)); }
        } else {
            await supabase.from('resource_reactions').insert({
                resource_id: resourceId, user_id: user.id, reaction_type: type,
            });
            setUserReaction(type);
            if (type === 'like') setLikeCount(c => c + 1);
            else setDislikeCount(c => c + 1);
        }
        setReacting(false);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!rating) return;
        setSubmitting(true);

        const res = await fetch(`/api/resources/${resourceId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comment: comment || null }),
        });

        if (res.ok) {
            const data = await res.json();
            const msg = data.aiDecision === 'approved' ? t('reviewApproved') : t('reviewPending');
            showToast(msg);
            setHasReviewed(true);
            setRating(0);
            setComment('');
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
                </div>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-3xl)' }}>
                        {t('resourceNotFound')}
                    </p>
                </div>
            </div>
        );
    }

    const lossTypes = resource.resource_loss_types?.map(lt => lt.loss_type) || [];
    const authorName = resource.profiles?.display_name || 'Anonymous';

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <button className={styles.backBtn} onClick={() => router.push(`/${locale}/resources`)}>
                    ← {t('backToList')}
                </button>

                {/* Hero */}
                <div className={styles.hero}>
                    {resource.cover_url ? (
                        <div className={styles.coverImage} style={{ backgroundImage: `url(${resource.cover_url})` }} />
                    ) : (
                        <div className={styles.coverPlaceholder}>
                            <span>{typeEmojis[resource.type] || '📄'}</span>
                        </div>
                    )}

                    <div className={styles.heroInfo}>
                        <div className={styles.badges}>
                            <span className="badge badge-primary">{t(`types.${resource.type}`)}</span>
                            {resource.worldview && resource.worldview !== 'universal' && (
                                <span className="badge badge-sage">{t(`worldviews.${resource.worldview}`)}</span>
                            )}
                            {resource.focus_theme && (
                                <span className="badge badge-warm">🎯 {resource.focus_theme}</span>
                            )}
                            {resource.availability && (
                                <span className="badge badge-calm" style={{ marginLeft: 'var(--space-xs)' }}>
                                    📍 {resource.availability}
                                </span>
                            )}
                        </div>
                        <h1 className={styles.title}>{resource.title}</h1>
                        {resource.author_or_creator && (
                            <p className={styles.authorCreator} style={{ fontStyle: 'italic', fontSize: 'var(--font-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                {resource.author_or_creator}
                            </p>
                        )}
                        <p className={styles.author}>{t('addedBy')} {authorName}</p>

                        {/* Star Rating Display */}
                        <div className={styles.ratingDisplay}>
                            <span className={styles.stars}>
                                {'★'.repeat(Math.round(resource.avg_rating || 0))}
                                {'☆'.repeat(5 - Math.round(resource.avg_rating || 0))}
                            </span>
                            <span className={styles.ratingValue}>
                                {(resource.avg_rating || 0).toFixed(1)}
                            </span>
                            <span className={styles.reviewCount}>
                                ({resource.review_count || 0} {t('reviewsLabel')})
                            </span>
                        </div>

                        {/* Reactions */}
                        <div className={styles.reactions}>
                            <button
                                className={`${styles.reactionBtn} ${userReaction === 'like' ? styles.reactionActive : ''}`}
                                onClick={() => handleReaction('like')}
                                disabled={!user || reacting}
                            >
                                👍 {likeCount}
                            </button>
                            <button
                                className={`${styles.reactionBtn} ${userReaction === 'dislike' ? styles.reactionActiveDislike : ''}`}
                                onClick={() => handleReaction('dislike')}
                                disabled={!user || reacting}
                            >
                                👎 {dislikeCount}
                            </button>
                        </div>

                        {resource.external_url && (
                            <a href={resource.external_url} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                                🔗 {t('viewExternal')}
                            </a>
                        )}
                    </div>
                </div>

                {/* Description */}
                {resource.description && (
                    <div className={styles.descriptionCard}>
                        <p>{resource.description}</p>
                    </div>
                )}

                {/* Loss Types */}
                {lossTypes.length > 0 && (
                    <div className={styles.lossTypesRow}>
                        {lossTypes.map(lt => (
                            <span key={lt} className="badge badge-warm">{t(`lossTypes.${lt}`)}</span>
                        ))}
                    </div>
                )}

                {/* Reviews Section */}
                <div className={styles.reviewsSection}>
                    <h2>{t('reviewsTitle')} ({reviews.length})</h2>

                    {/* Review Form */}
                    {user && !hasReviewed && (
                        <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                            <h3>{t('writeReview')}</h3>
                            <div className={styles.starInput}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`${styles.starBtn} ${star <= (hoverRating || rating) ? styles.starActive : ''}`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <div className="form-group">
                                <textarea
                                    className="form-input form-textarea"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, 255))}
                                    placeholder={t('reviewPlaceholder')}
                                    maxLength={255}
                                    rows={3}
                                />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
                                    {comment.length}/255
                                </span>
                            </div>
                            <p className={styles.pendingNotice}>📋 {t('reviewPendingNotice')}</p>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={!rating || submitting}>
                                {submitting ? '...' : t('submitReview')}
                            </button>
                        </form>
                    )}

                    {hasReviewed && (
                        <p className={styles.alreadyReviewed}>✅ {t('alreadyReviewed')}</p>
                    )}

                    {/* Reviews List */}
                    {reviews.length === 0 ? (
                        <p className={styles.noReviews}>{t('noReviews')}</p>
                    ) : (
                        <div className={styles.reviewsList}>
                            {reviews.map(rev => (
                                <div key={rev.id} className={styles.reviewItem}>
                                    <div className={styles.reviewHeader}>
                                        <span className={styles.reviewStars}>
                                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                        </span>
                                        <span className={styles.reviewAuthor}>
                                            {rev.profiles?.display_name || 'Anonymous'}
                                        </span>
                                        <span className={styles.reviewDate}>
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {rev.comment && <p className={styles.reviewComment}>{rev.comment}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
        </div>
    );
}

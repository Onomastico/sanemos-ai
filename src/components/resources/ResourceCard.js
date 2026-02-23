'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './ResourceCard.module.css';

const typeEmojis = {
    book: '📖',
    series: '📺',
    movie: '🎬',
    comic: '🦸',
    manga: '📕',
    song: '🎵',
    other: '📄',
};

export default function ResourceCard({ resource, locale, currentUser }) {
    const t = useTranslations('resources');
    const router = useRouter();
    const lossTypes = resource.resource_loss_types?.map((lt) => lt.loss_type) || [];
    const authorName = resource.profiles?.display_name || 'Anonymous';

    const userId = currentUser?.id || null;

    const [userReaction, setUserReaction] = useState(null);
    const [likeCount, setLikeCount] = useState(resource.like_count || 0);
    const [dislikeCount, setDislikeCount] = useState(resource.dislike_count || 0);
    const [reacting, setReacting] = useState(false);

    useEffect(() => {
        const loadReaction = async () => {
            if (!userId) return;
            const supabase = createClient();

            const { data } = await supabase
                .from('resource_reactions')
                .select('reaction_type')
                .eq('resource_id', resource.id)
                .eq('user_id', userId)
                .single();

            if (data) setUserReaction(data.reaction_type);
        };

        loadReaction();
    }, [resource.id, userId]);

    const handleReaction = async (type) => {
        if (!userId || reacting) return;
        setReacting(true);

        const supabase = createClient();

        if (userReaction === type) {
            // Remove reaction
            await supabase.from('resource_reactions')
                .delete()
                .eq('resource_id', resource.id)
                .eq('user_id', userId);

            setUserReaction(null);
            if (type === 'like') setLikeCount((c) => Math.max(0, c - 1));
            else setDislikeCount((c) => Math.max(0, c - 1));
        } else if (userReaction) {
            // Change reaction
            await supabase.from('resource_reactions')
                .update({ reaction_type: type })
                .eq('resource_id', resource.id)
                .eq('user_id', userId);

            setUserReaction(type);
            if (type === 'like') {
                setLikeCount((c) => c + 1);
                setDislikeCount((c) => Math.max(0, c - 1));
            } else {
                setDislikeCount((c) => c + 1);
                setLikeCount((c) => Math.max(0, c - 1));
            }
        } else {
            // New reaction
            await supabase.from('resource_reactions').insert({
                resource_id: resource.id,
                user_id: userId,
                reaction_type: type,
            });

            setUserReaction(type);
            if (type === 'like') setLikeCount((c) => c + 1);
            else setDislikeCount((c) => c + 1);
        }

        setReacting(false);
    };

    return (
        <div className={styles.card} onClick={() => router.push(`/${locale}/resources/${resource.id}`)} style={{ cursor: 'pointer' }}>
            {resource.cover_url ? (
                <div className={styles.coverImage} style={{ backgroundImage: `url(${resource.cover_url})` }} />
            ) : (
                <div className={styles.coverPlaceholder}>
                    <span>{typeEmojis[resource.type] || '📄'}</span>
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.meta}>
                    <span className={`badge badge-primary`}>{t(`types.${resource.type}`)}</span>
                    {resource.worldview && resource.worldview !== 'universal' && (
                        <span className={`badge badge-sage`}>{t(`worldviews.${resource.worldview}`)}</span>
                    )}
                    <div className={styles.rating}>
                        <span className={styles.ratingStars}>
                            {'★'.repeat(Math.round(resource.avg_rating || 0))}
                            {'☆'.repeat(5 - Math.round(resource.avg_rating || 0))}
                        </span>
                        <span className={styles.reviewCount}>
                            ({resource.review_count || 0})
                        </span>
                    </div>
                </div>

                <h3 className={styles.title}>{resource.title}</h3>

                {resource.author_or_creator && (
                    <p className={styles.authorCreator} style={{ fontStyle: 'italic', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                        {resource.author_or_creator}
                    </p>
                )}

                {resource.description && (
                    <p className={styles.description}>{resource.description}</p>
                )}

                {lossTypes.length > 0 && (
                    <div className={styles.lossTypes}>
                        {lossTypes.map((lt) => (
                            <span key={lt} className={`badge badge-warm`}>
                                {t(`lossTypes.${lt}`)}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reactions */}
                <div className={styles.reactions}>
                    <button
                        className={`${styles.reactionBtn} ${userReaction === 'like' ? styles.reactionActive : ''}`}
                        onClick={() => handleReaction('like')}
                        disabled={!userId || reacting}
                        title={t('like')}
                    >
                        <span className={styles.reactionIcon}>👍</span>
                        <span className={styles.reactionCount}>{likeCount}</span>
                    </button>
                    <button
                        className={`${styles.reactionBtn} ${userReaction === 'dislike' ? styles.reactionActiveDislike : ''}`}
                        onClick={() => handleReaction('dislike')}
                        disabled={!userId || reacting}
                        title={t('dislike')}
                    >
                        <span className={styles.reactionIcon}>👎</span>
                        <span className={styles.reactionCount}>{dislikeCount}</span>
                    </button>
                </div>

                <div className={styles.footer}>
                    <span className={styles.author}>
                        {resource.availability ? (
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--primary-hover)' }}>📍 {resource.availability}</span>
                        ) : (
                            <>{t('addedBy')} {authorName}</>
                        )}
                    </span>
                    {resource.external_url && (
                        <a
                            href={resource.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.externalLink}
                        >
                            ↗
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../therapists.module.css';

export default function TherapistDetailPage() {
    const t = useTranslations('therapists');
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const locale = pathname.split('/')[1] || 'en';
    const therapistId = params.id;

    const [therapist, setTherapist] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Review form state
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Load therapist
            const { data: therapistData } = await supabase
                .from('therapists')
                .select('*')
                .eq('id', therapistId)
                .single();

            setTherapist(therapistData);

            // Load reviews with author names
            const { data: reviewsData } = await supabase
                .from('therapist_reviews')
                .select('*, profiles(display_name)')
                .eq('therapist_id', therapistId)
                .order('created_at', { ascending: false });

            setReviews(reviewsData || []);
            setLoading(false);
        };

        init();
    }, [therapistId]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!rating || !user) return;

        setSubmitting(true);
        const supabase = createClient();

        const { error } = await supabase.from('therapist_reviews').insert({
            therapist_id: therapistId,
            user_id: user.id,
            rating,
            comment: comment || null,
            is_anonymous: isAnonymous,
        });

        if (!error) {
            // Reload reviews
            const { data: reviewsData } = await supabase
                .from('therapist_reviews')
                .select('*, profiles(display_name)')
                .eq('therapist_id', therapistId)
                .order('created_at', { ascending: false });

            setReviews(reviewsData || []);
            setRating(0);
            setComment('');
            setIsAnonymous(false);

            // Reload therapist to get updated rating
            const { data: updatedTherapist } = await supabase
                .from('therapists')
                .select('*')
                .eq('id', therapistId)
                .single();
            setTherapist(updatedTherapist);
        }

        setSubmitting(false);
    };

    const hasReviewed = reviews.some(r => r.user_id === user?.id);

    if (loading) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.detailContainer}>
                    <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
                </div>
            </div>
        );
    }

    if (!therapist) {
        return (
            <div className={styles.detailPage}>
                <div className={styles.detailContainer}>
                    <p>{t('notFound')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.detailPage}>
            <div className={styles.detailContainer}>
                <button className={styles.backBtn} onClick={() => router.push(`/${locale}/therapists`)}>
                    ← {t('backToList')}
                </button>

                {/* Profile Card */}
                <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                        {therapist.photo_url ? (
                            <img src={therapist.photo_url} alt={therapist.full_name} className={styles.profileAvatar} />
                        ) : (
                            <div className={styles.profileAvatarPlaceholder}>
                                {therapist.full_name?.charAt(0) || '?'}
                            </div>
                        )}
                        <div>
                            <h1 className={styles.profileName}>
                                {therapist.full_name}
                                {therapist.is_verified && <span className={styles.verifiedBadge} title="Verified">✓</span>}
                            </h1>
                            {therapist.title && (
                                <span className={styles.profileTitleText}>{therapist.title}</span>
                            )}
                            <div className={styles.cardRating} style={{ marginTop: '8px' }}>
                                <span className={styles.stars}>
                                    {'★'.repeat(Math.round(therapist.avg_rating || 0))}
                                    {'☆'.repeat(5 - Math.round(therapist.avg_rating || 0))}
                                </span>
                                <span className={styles.reviewCount}>
                                    ({therapist.review_count || 0} {t('reviews')})
                                </span>
                            </div>
                        </div>
                    </div>

                    {therapist.bio && (
                        <p className={styles.profileBio}>{therapist.bio}</p>
                    )}

                    <div className={styles.profileDetails}>
                        {therapist.city && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>{t('location')}</span>
                                <span className={styles.detailValue}>
                                    {therapist.city}{therapist.country ? `, ${therapist.country}` : ''}
                                </span>
                            </div>
                        )}
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>{t('modality')}</span>
                            <span className={styles.detailValue}>
                                {t(`modalities.${therapist.modality}`)}
                            </span>
                        </div>
                        {therapist.languages?.length > 0 && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>{t('languages')}</span>
                                <span className={styles.detailValue}>
                                    {therapist.languages.join(', ')}
                                </span>
                            </div>
                        )}
                        {therapist.license_number && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>{t('license')}</span>
                                <span className={styles.detailValue}>{therapist.license_number}</span>
                            </div>
                        )}
                    </div>

                    {therapist.specializations?.length > 0 && (
                        <div className={styles.profileSpecs}>
                            {therapist.specializations.map((s) => (
                                <span key={s} className={styles.specTag}>
                                    {t(`specializations.${s}`)}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className={styles.profileLinks}>
                        {therapist.website && (
                            <a href={therapist.website} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
                                🌐 {t('website')}
                            </a>
                        )}
                        {therapist.linkedin_url && (
                            <a href={therapist.linkedin_url} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
                                💼 {t('linkedin')}
                            </a>
                        )}
                        {therapist.credentials_url && (
                            <a href={therapist.credentials_url} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
                                📜 {t('credentials')}
                            </a>
                        )}
                        {therapist.email && (
                            <a href={`mailto:${therapist.email}`} className={styles.profileLink}>
                                ✉️ {t('email')}
                            </a>
                        )}
                        {therapist.phone && (
                            <a href={`tel:${therapist.phone}`} className={styles.profileLink}>
                                📞 {t('phone')}
                            </a>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className={styles.reviewsSection}>
                    <h2>{t('reviews')} ({reviews.length})</h2>

                    {/* Review Form */}
                    {user && !hasReviewed && (
                        <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                            <h3>{t('writeReview')}</h3>

                            <div className={styles.ratingInput}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`${styles.ratingBtn} ${star <= rating ? styles.ratingBtnActive : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        {star <= rating ? '★' : '☆'}
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

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                />
                                <label htmlFor="anonymous" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    {t('postAnonymously')}
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!rating || submitting}
                            >
                                {submitting ? '...' : t('submitReview')}
                            </button>
                        </form>
                    )}

                    {/* Review List */}
                    {reviews.length === 0 ? (
                        <div className={styles.emptyReviews}>
                            <p>{t('noReviews')}</p>
                        </div>
                    ) : (
                        <div className={styles.reviewList}>
                            {reviews.map((review) => (
                                <div key={review.id} className={styles.reviewItem}>
                                    <div className={styles.reviewHeader}>
                                        <span className={styles.reviewAuthor}>
                                            {review.is_anonymous ? t('anonymous') : (review.profiles?.display_name || t('anonymous'))}
                                        </span>
                                        <span className={styles.reviewDate}>
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.reviewStars}>
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                    {review.comment && (
                                        <p className={styles.reviewComment}>{review.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

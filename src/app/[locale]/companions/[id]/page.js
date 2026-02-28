'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAgent } from '@/lib/ai/agents';
import Image from 'next/image';
import styles from './detail.module.css';
import { createClient } from '@/lib/supabase/client';

export default function CompanionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = params.locale || 'en';
    const id = params.id;

    const agent = getAgent(id);
    const [userCount, setUserCount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!agent) {
            router.push(`/${locale}/companions`);
            return;
        }

        fetch('/api/companions/stats')
            .then(res => res.json())
            .then(data => {
                if (data.stats && data.stats[id] !== undefined) {
                    setUserCount(data.stats[id]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id, agent, locale, router]);

    if (!agent) return null;

    const traits = agent.traits?.[locale] || agent.traits?.en || [];
    const quote = agent.quote?.[locale] || agent.quote?.en;
    const bestFor = agent.bestFor?.[locale] || agent.bestFor?.en || [];
    const description = agent.description[locale] || agent.description.en;

    const startChat = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push(`/${locale}/auth/login?redirect=/${locale}/companions/${id}`);
            return;
        }

        try {
            const { data: convs } = await supabase
                .from('conversation_participants')
                .select('conversation_id');

            if (convs && convs.length > 0) {
                const res = await fetch(`/api/chat/search?query=&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    const existingChat = data.conversations?.find(
                        c => c.type === 'ai' && c.ai_agent_type === id
                    );
                    if (existingChat) {
                        router.push(`/${locale}/chat/${existingChat.id}`);
                        return;
                    }
                }
            }

            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentType: id,
                    title: `Chat con ${agent.name}`
                })
            });

            if (res.ok) {
                const newConv = await res.json();
                const conversationId = newConv.conversation ? newConv.conversation.id : newConv.id;
                router.push(`/${locale}/chat/${conversationId}`);
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    return (
        <div className={styles.page}>
            <button className={styles.backButton} onClick={() => router.push(`/${locale}/companions`)}>
                ← {locale === 'es' ? 'Volver a Compañeros' : 'Back to Companions'}
            </button>

            <div className={styles.card} style={{ '--agent-color': agent.color }}>
                {/* Hero — full image with gradient overlay */}
                <div className={styles.hero}>
                    {agent.avatar ? (
                        <Image
                            src={agent.avatar}
                            alt={agent.name}
                            fill
                            className={styles.heroImage}
                            priority
                        />
                    ) : (
                        <div className={styles.heroFallback}>
                            <span className={styles.heroFallbackEmoji}>{agent.emoji}</span>
                        </div>
                    )}
                    <div className={styles.heroOverlay} />
                    <div className={styles.heroContent}>
                        <span className={styles.heroEmoji}>{agent.emoji}</span>
                        <h1 className={styles.name}>{agent.name}</h1>
                        <span className={styles.focusLabel}>
                            {agent.focus[locale] || agent.focus.en}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Trait chips */}
                    {traits.length > 0 && (
                        <div className={styles.traits}>
                            {traits.map((t) => (
                                <span key={t} className={styles.trait}>{t}</span>
                            ))}
                        </div>
                    )}

                    {/* Quote */}
                    {quote && (
                        <blockquote className={styles.quote}>{quote}</blockquote>
                    )}

                    <hr className={styles.divider} />

                    {/* About */}
                    <div className={styles.section}>
                        <p className={styles.sectionTitle}>
                            {locale === 'es' ? 'Enfoque' : 'Approach'}
                        </p>
                        <p className={styles.description}>{description}</p>
                    </div>

                    {/* Best for */}
                    {bestFor.length > 0 && (
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>
                                {locale === 'es' ? 'Ideal cuando...' : 'Best for...'}
                            </p>
                            <ul className={styles.bestForList}>
                                {bestFor.map((item) => (
                                    <li key={item} className={styles.bestForItem}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <hr className={styles.divider} />

                    {/* Stats */}
                    {!loading && userCount !== null && (
                        <div className={styles.statsRow}>
                            <span className={styles.statIcon}>👥</span>
                            <div>
                                <div className={styles.statNum}>{userCount}</div>
                                <div className={styles.statLabel}>
                                    {locale === 'es' ? 'personas acompañadas' : 'people supported'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <button className={styles.cta} onClick={startChat}>
                        {locale === 'es'
                            ? `Iniciar conversación con ${agent.name}`
                            : `Start chatting with ${agent.name}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

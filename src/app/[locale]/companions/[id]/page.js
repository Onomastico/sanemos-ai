'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAgent } from '@/lib/ai/agents';
import Image from 'next/image';
import styles from '../page.module.css';
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
            .catch(err => {
                console.error("Failed to fetch stats", err);
                setLoading(false);
            });
    }, [id, agent, locale, router]);

    if (!agent) return null; // Or a loading spinner

    const startChat = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push(`/${locale}/auth/login?redirect=/${locale}/companions/${id}`);
            return;
        }

        try {
            // Check if there's already an active conversation with this agent
            // This mirrors the logic in chat/page.js
            const { data: convs } = await supabase
                .from('conversation_participants')
                .select('conversation_id');

            if (convs && convs.length > 0) {
                const convIds = convs.map(c => c.conversation_id);
                // Get AI conversations matching this agent
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

            // Create a new one
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
        <div className={styles.detailContainer}>
            <button className={styles.backButton} onClick={() => router.push(`/${locale}/companions`)}>
                ← {locale === 'es' ? 'Volver a Compañeros' : 'Back to Companions'}
            </button>

            <div className={styles.card} style={{ '--agent-color': agent.color }}>
                <div className={styles.header}>
                    <div className={styles.avatarWrapperLarge}>
                        {agent.avatar ? (
                            <Image src={agent.avatar} alt={agent.name} fill className={styles.avatar} />
                        ) : (
                            <span className={styles.emojiLarge}>{agent.emoji}</span>
                        )}
                    </div>

                    <div className={styles.titleArea}>
                        <h1 className={styles.name}>{agent.name}</h1>
                        <span className={styles.focusLabel}>{agent.focus[locale] || agent.focus.en}</span>
                    </div>
                </div>

                <div className={styles.statsPanel}>
                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>
                            {loading ? '...' : (userCount || 0)}
                        </span>
                        <span className={styles.statLabel}>
                            {locale === 'es' ? 'Personas acompañadas' : 'People Supported'}
                        </span>
                    </div>
                </div>

                <div className={styles.contentArea}>
                    <h2>{locale === 'es' ? 'Sobre el enfoque' : 'About the approach'}</h2>
                    <p className={styles.fullDescription}>
                        {agent.description[locale] || agent.description.en}
                    </p>

                    <div className={styles.systemPromptCard}>
                        <strong>{locale === 'es' ? 'Personalidad de IA:' : 'AI Personality:'}</strong>
                        <p>{agent.systemPrompt && agent.systemPrompt.split('.')[0] + '.'}</p>
                    </div>
                </div>

                <button className={`btn btn-primary ${styles.startBtn}`} onClick={startChat}>
                    {locale === 'es' ? 'Iniciar Conversación' : 'Start Chat'}
                </button>
            </div>
        </div>
    );
}

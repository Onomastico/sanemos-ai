'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAllAgents } from '@/lib/ai/agents';
import CompanionCard from '@/components/companions/CompanionCard';
import styles from './page.module.css';

export default function CompanionsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const agents = getAllAgents();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/companions/stats')
            .then(res => res.json())
            .then(data => {
                if (data.stats) {
                    setStats(data.stats);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch stats", err);
                setLoading(false);
            });
    }, []);

    const viewDetails = (agentId) => {
        router.push(`/${locale}/companions/${agentId}`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>
                    {locale === 'es' ? 'Compañeros de IA' : 'AI Companions'}
                </h1>
                <p className={styles.subtitle}>
                    {locale === 'es'
                        ? 'Elige un compañero con quien hablar. Cada uno tiene un enfoque único para acompañarte en tu proceso.'
                        : 'Choose a companion to talk with. Each one has a unique approach to support you on your journey.'}
                </p>
            </div>

            <div className={styles.grid}>
                {agents.map((agent) => (
                    <CompanionCard
                        key={agent.id}
                        agent={agent}
                        locale={locale}
                        userCount={loading ? undefined : (stats[agent.id] || 0)}
                        onClick={() => viewDetails(agent.id)}
                    />
                ))}
            </div>
        </div>
    );
}

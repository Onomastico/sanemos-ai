'use client';

import Image from 'next/image';
import styles from './AgentCard.module.css';

export default function AgentCard({ agent, locale, onClick }) {
    return (
        <button
            className={styles.card}
            onClick={onClick}
            style={{ '--agent-color': agent.color }}
        >
            <div className={styles.header}>
                {agent.avatar ? (
                    <div className={styles.avatarWrapper}>
                        <Image src={agent.avatar} alt={agent.name} fill className={styles.avatar} />
                    </div>
                ) : (
                    <span className={styles.emoji}>{agent.emoji}</span>
                )}
                <div>
                    <h3 className={styles.name}>{agent.name}</h3>
                    <span className={styles.focus}>{agent.focus[locale] || agent.focus.en}</span>
                </div>
            </div>
            <p className={styles.description}>
                {agent.description[locale] || agent.description.en}
            </p>
            <div className={styles.glow} />
        </button>
    );
}

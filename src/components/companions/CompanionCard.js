import Image from 'next/image';
import styles from './CompanionCard.module.css';

export default function CompanionCard({ agent, locale, onClick, userCount }) {
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

            <div className={styles.statsRow}>
                <span className={styles.statIcon}>👥</span>
                <span className={styles.statText}>
                    {userCount !== undefined
                        ? `${userCount} ${locale === 'es' ? 'personas acompañadas' : 'people supported'}`
                        : '...'}
                </span>
            </div>

            <div className={styles.glow} />
        </button>
    );
}

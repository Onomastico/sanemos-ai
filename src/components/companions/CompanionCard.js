import Image from 'next/image';
import styles from './CompanionCard.module.css';

export default function CompanionCard({ agent, locale, onClick, userCount }) {
    const traits = agent.traits?.[locale] || agent.traits?.en || [];
    const quote = agent.quote?.[locale] || agent.quote?.en;

    return (
        <button
            className={styles.card}
            onClick={onClick}
            style={{ '--agent-color': agent.color }}
        >
            {/* Hero area with avatar + gradient */}
            <div className={styles.hero}>
                <div className={styles.avatarWrapper}>
                    {agent.avatar ? (
                        <Image src={agent.avatar} alt={agent.name} fill className={styles.avatar} />
                    ) : (
                        <span className={styles.emoji}>{agent.emoji}</span>
                    )}
                </div>
                <span className={styles.emojiOverlay}>{agent.emoji}</span>
            </div>

            {/* Identity */}
            <div className={styles.identity}>
                <h3 className={styles.name}>{agent.name}</h3>
                <span className={styles.focus}>{agent.focus[locale] || agent.focus.en}</span>
            </div>

            {/* Quote */}
            {quote && (
                <p className={styles.quote}>{quote}</p>
            )}

            {/* Description */}
            <p className={styles.description}>
                {agent.description[locale] || agent.description.en}
            </p>

            {/* Traits */}
            {traits.length > 0 && (
                <div className={styles.traits}>
                    {traits.map((trait) => (
                        <span key={trait} className={styles.trait}>{trait}</span>
                    ))}
                </div>
            )}

            {/* Footer: stats + CTA */}
            <div className={styles.footer}>
                {userCount !== undefined && (
                    <span className={styles.statText}>
                        👥 {userCount} {locale === 'es' ? 'acompañadas' : 'supported'}
                    </span>
                )}
                <span className={styles.cta}>
                    {locale === 'es' ? 'Hablar →' : 'Chat →'}
                </span>
            </div>

            <div className={styles.glow} />
        </button>
    );
}

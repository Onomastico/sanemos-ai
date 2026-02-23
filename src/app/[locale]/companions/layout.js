import styles from './page.module.css';

export default function CompanionsLayout({ children }) {
    return (
        <div className={styles.layout}>
            {children}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './CommunityOnline.module.css';

export default function CommunityOnline({ onlineUsers, currentUser, onRequestChat }) {
    const [requestingId, setRequestingId] = useState(null);
    const router = useRouter();
    const params = useParams();
    const locale = params.locale || 'es';

    // Filter out current user from the list
    const othersOnline = onlineUsers.filter(u => u.id !== currentUser?.id);

    const handleRequest = async (user) => {
        setRequestingId(user.id);
        if (onRequestChat) {
            await onRequestChat(user);
        }
        setRequestingId(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span>Comunidad en línea</span>
                <span className={styles.onlineBadge}>{onlineUsers.length}</span>
            </div>

            <div className={styles.list}>
                {othersOnline.length === 0 ? (
                    <div className={styles.emptyState}>
                        Nadie más está conectado en este momento.
                    </div>
                ) : (
                    othersOnline.map((user) => (
                        <div key={user.id || user.name} className={styles.userCard}>
                            <div className={styles.userInfo}>
                                <div className={styles.avatar}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        "👤"
                                    )}
                                </div>
                                <div className={styles.details}>
                                    <span className={styles.name}>{user.name}</span>
                                    <div className={styles.tags}>
                                        {user.loss_type && (
                                            <span className={styles.tag}>{user.loss_type}</span>
                                        )}
                                        {user.worldview && (
                                            <span className={styles.tag}>{user.worldview}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => router.push(`/${locale}/profile/${user.id}`)}
                                    title="Ver perfil público"
                                >
                                    👁️
                                </button>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => handleRequest(user)}
                                    disabled={requestingId === user.id}
                                    title="Enviar solicitud de chat"
                                >
                                    {requestingId === user.id ? '...' : '💬'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from '@/app/[locale]/auth/auth.module.css';

function ConfirmedContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = pathname.split('/')[1] || 'es';
    const error = searchParams.get('error');
    const es = locale === 'es';

    if (error) {
        const msg = error === 'not_found'
            ? (es ? 'No se encontró el turno.' : 'Shift not found.')
            : error === 'expired'
            ? (es ? 'Este turno ya fue procesado o cancelado.' : 'This shift has already been processed or cancelled.')
            : (es ? 'Ocurrió un error. Por favor contacta al equipo.' : 'An error occurred. Please contact the team.');
        return (
            <div className={styles.authPage}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <span className={styles.authIcon}>⚠️</span>
                        <h1>{es ? 'No pudimos procesar tu respuesta' : 'Could not process your response'}</h1>
                        <p>{msg}</p>
                    </div>
                    <div style={{ textAlign: 'center', paddingBottom: 'var(--space-lg)' }}>
                        <a href={`/${locale}`} className="btn btn-secondary btn-sm">
                            {es ? 'Ir al inicio' : 'Go home'}
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authIcon}>✅</span>
                    <h1>{es ? '¡Turno confirmado!' : 'Shift confirmed!'}</h1>
                    <p>
                        {es
                            ? 'Gracias por confirmar tu disponibilidad. Recuerda ingresar a sanemos.ai en el horario de tu turno y hacer clic en "Iniciar turno" desde tu perfil.'
                            : 'Thank you for confirming. Remember to log in to sanemos.ai at your shift time and click "Start shift" from your profile.'}
                    </p>
                </div>
                <div style={{ textAlign: 'center', paddingBottom: 'var(--space-lg)' }}>
                    <a href={`/${locale}/dashboard`} className="btn btn-primary btn-sm">
                        {es ? 'Ir al panel' : 'Go to dashboard'}
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function ShiftConfirmedPage() {
    return (
        <Suspense fallback={null}>
            <ConfirmedContent />
        </Suspense>
    );
}

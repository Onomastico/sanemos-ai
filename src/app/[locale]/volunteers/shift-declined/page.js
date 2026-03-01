'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from '@/app/[locale]/auth/auth.module.css';

function DeclinedContent() {
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
                    <span className={styles.authIcon}>🙏</span>
                    <h1>{es ? 'Recibimos tu respuesta' : 'We received your response'}</h1>
                    <p>
                        {es
                            ? 'Entendemos que no podrás estar disponible para ese turno. Gracias por avisarnos con anticipación — eso nos ayuda mucho.'
                            : 'We understand you won\'t be available for that shift. Thank you for letting us know in advance — it really helps.'}
                    </p>
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

export default function ShiftDeclinedPage() {
    return (
        <Suspense fallback={null}>
            <DeclinedContent />
        </Suspense>
    );
}

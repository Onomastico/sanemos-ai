'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/[locale]/auth/auth.module.css';

export default function VolunteerApplyPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [motivation, setMotivation] = useState('');
    const [availability, setAvailability] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Pre-fill if logged in
    useEffect(() => {
        const prefill = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setEmail(user.email || '');
                    setName(user.user_metadata?.display_name || '');
                }
            } catch { /* not logged in */ }
        };
        prefill();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError(locale === 'es' ? 'El nombre es requerido.' : 'Name is required.');
        if (!email.trim() || !email.includes('@')) return setError(locale === 'es' ? 'El email es requerido.' : 'A valid email is required.');

        setLoading(true);
        const res = await fetch('/api/volunteers/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, motivation, availability_notes: availability }),
        });
        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(data.error || (locale === 'es' ? 'Error al enviar la solicitud.' : 'Error submitting application.'));
            return;
        }

        setSuccess(true);
    };

    const es = locale === 'es';

    if (success) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <span className={styles.authIcon}>🤝</span>
                        <h1>{es ? '¡Solicitud enviada!' : 'Application submitted!'}</h1>
                        <p>{es
                            ? 'Recibimos tu solicitud. Te enviaremos un correo de confirmación y nuestro equipo la revisará pronto.'
                            : 'We received your application. You\'ll get a confirmation email and our team will review it shortly.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authIcon}>🤝</span>
                    <h1>{es ? 'Quiero ser voluntario/a' : 'Volunteer Application'}</h1>
                    <p style={{ maxWidth: '380px', margin: '0 auto' }}>
                        {es
                            ? 'Los voluntarios de sanemos.ai se conectan en horarios definidos para acompañar a personas en duelo. Tu presencia marca una diferencia real.'
                            : 'sanemos.ai volunteers connect at scheduled times to support people in grief. Your presence makes a real difference.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    {error && <div className={styles.authError}>{error}</div>}

                    <div className="form-group">
                        <label className="form-label" htmlFor="name">{es ? 'Nombre completo' : 'Full name'} *</label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={es ? 'Tu nombre' : 'Your name'}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">{es ? 'Correo electrónico' : 'Email address'} *</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@correo.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="motivation">
                            {es ? '¿Por qué quieres ser voluntario/a?' : 'Why do you want to volunteer?'}
                        </label>
                        <textarea
                            id="motivation"
                            className="form-input form-textarea"
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            placeholder={es
                                ? 'Comparte tu motivación, experiencia con el duelo o lo que te impulsa a acompañar a otros...'
                                : 'Share your motivation, experience with grief, or what drives you to support others...'}
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="availability">
                            {es ? 'Disponibilidad general' : 'General availability'}
                        </label>
                        <textarea
                            id="availability"
                            className="form-input form-textarea"
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                            placeholder={es
                                ? 'Ej: tardes entre semana, fines de semana por la mañana, zona horaria Chile Continental...'
                                : 'E.g. weekday evenings, weekend mornings, timezone: Chile (CLT)...'}
                            rows={2}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '...' : (es ? 'Enviar solicitud' : 'Submit application')}
                    </button>
                </form>

                <div className={styles.authFooter}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {es
                            ? 'Al enviar esta solicitud, aceptas ser contactado/a por el equipo de sanemos.ai por correo electrónico.'
                            : 'By submitting, you agree to be contacted by the sanemos.ai team via email.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

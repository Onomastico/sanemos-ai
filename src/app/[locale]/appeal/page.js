'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

const APPEAL_TYPES_ES = [
    { value: 'content_removed', label: 'Contenido eliminado o rechazado' },
    { value: 'strike', label: 'Strike / aviso formal recibido' },
    { value: 'suspension_temp', label: 'Suspensión temporal' },
    { value: 'suspension_perm', label: 'Suspensión permanente' },
    { value: 'other', label: 'Otro' },
];
const APPEAL_TYPES_EN = [
    { value: 'content_removed', label: 'Content removed or rejected' },
    { value: 'strike', label: 'Strike / formal notice received' },
    { value: 'suspension_temp', label: 'Temporary suspension' },
    { value: 'suspension_perm', label: 'Permanent suspension' },
    { value: 'other', label: 'Other' },
];

export default function AppealPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'en';
    const isEs = locale === 'es';

    const [appealType, setAppealType] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const appealTypes = isEs ? APPEAL_TYPES_ES : APPEAL_TYPES_EN;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!appealType || !displayName.trim() || !email.trim() || !description.trim()) return;

        setStatus('sending');
        setErrorMsg('');

        try {
            const res = await fetch('/api/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appeal_type: appealType, display_name: displayName, email, description }),
            });

            if (res.ok) {
                setStatus('sent');
            } else {
                const data = await res.json().catch(() => ({}));
                setErrorMsg(data.error || (isEs ? 'Error al enviar.' : 'Error submitting.'));
                setStatus('error');
            }
        } catch {
            setErrorMsg(isEs ? 'Error de conexión.' : 'Connection error.');
            setStatus('error');
        }
    };

    if (status === 'sent') {
        return (
            <div className={styles.landing} style={{ minHeight: '80vh', paddingTop: '100px' }}>
                <div className={styles.container} style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>✅</div>
                    <h1 className={styles.heroTitle} style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
                        {isEs ? 'Apelación recibida' : 'Appeal received'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                        {isEs
                            ? 'Hemos recibido tu apelación. Un miembro del equipo distinto al que tomó la decisión original la revisará en un plazo de 5 días hábiles y responderá al correo que indicaste.'
                            : 'We have received your appeal. A team member different from the one who made the original decision will review it within 5 business days and respond to the email you provided.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.landing} style={{ minHeight: '80vh', paddingTop: '100px' }}>
            <div className={styles.container} style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-md)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem' }}>
                        {isEs ? '📬 Apelar una Decisión' : '📬 Appeal a Decision'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {isEs
                            ? 'Si crees que una decisión de moderación fue incorrecta, podemos revisarla.'
                            : 'If you believe a moderation decision was incorrect, we can review it.'}
                    </p>
                </div>

                <div style={{
                    background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md) var(--space-lg)',
                    marginBottom: 'var(--space-xl)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.7',
                }}>
                    {isEs
                        ? 'Las apelaciones son revisadas por un miembro del equipo distinto al que tomó la decisión original. Respondemos en un plazo de 5 días hábiles.'
                        : 'Appeals are reviewed by a team member different from the one who made the original decision. We respond within 5 business days.'}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Tipo de sanción apelada *' : 'Type of sanction being appealed *'}
                        </label>
                        <select
                            value={appealType}
                            onChange={e => setAppealType(e.target.value)}
                            required
                            style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}
                        >
                            <option value="">{isEs ? 'Selecciona un tipo' : 'Select a type'}</option>
                            {appealTypes.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Nombre de pantalla en sanemos.ai *' : 'Display name on sanemos.ai *'}
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            required
                            maxLength={100}
                            style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Correo electrónico para respuesta *' : 'Email address for response *'}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Descripción de la apelación *' : 'Description of the appeal *'}
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            maxLength={2000}
                            rows={6}
                            placeholder={isEs
                                ? 'Explica por qué crees que la decisión fue incorrecta. Incluye el contenido afectado, la fecha aproximada y cualquier contexto relevante...'
                                : 'Explain why you believe the decision was incorrect. Include the affected content, approximate date, and any relevant context...'}
                            style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', resize: 'vertical', minHeight: '140px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>{description.length}/2000</p>
                    </div>

                    {status === 'error' && (
                        <p style={{ color: 'var(--accent-alert)', fontSize: 'var(--font-size-sm)' }}>{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={status === 'sending'}
                        style={{ alignSelf: 'flex-end' }}
                    >
                        {status === 'sending'
                            ? (isEs ? 'Enviando...' : 'Sending...')
                            : (isEs ? 'Enviar apelación' : 'Submit appeal')}
                    </button>
                </form>
            </div>
        </div>
    );
}

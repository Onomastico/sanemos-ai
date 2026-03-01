'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

const RIGHT_TYPES_ES = [
    { value: 'access', label: 'Acceso — Saber qué datos personales tenemos sobre ti' },
    { value: 'rectification', label: 'Rectificación — Corregir datos inexactos o incompletos' },
    { value: 'cancellation', label: 'Cancelación — Solicitar la eliminación de tus datos' },
    { value: 'opposition', label: 'Oposición — Oponerte al tratamiento de tus datos' },
    { value: 'delete_account', label: 'Eliminación de cuenta — Borrar tu cuenta y todos tus datos' },
];

const RIGHT_TYPES_EN = [
    { value: 'access', label: 'Access — Find out what personal data we hold about you' },
    { value: 'rectification', label: 'Rectification — Correct inaccurate or incomplete data' },
    { value: 'cancellation', label: 'Cancellation — Request deletion of your data' },
    { value: 'opposition', label: 'Opposition — Object to the processing of your data' },
    { value: 'delete_account', label: 'Account deletion — Delete your account and all your data' },
];

export default function ArcoPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'en';
    const isEs = locale === 'es';

    const [rightType, setRightType] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    const rightTypes = isEs ? RIGHT_TYPES_ES : RIGHT_TYPES_EN;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rightType || !name.trim() || !email.trim() || !description.trim()) return;

        setStatus('sending');
        setErrorMsg('');

        try {
            const res = await fetch('/api/arco', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ right_type: rightType, name, email, description }),
            });

            if (res.ok) {
                setStatus('sent');
            } else {
                const data = await res.json().catch(() => ({}));
                setErrorMsg(data.error || (isEs ? 'Error al enviar la solicitud.' : 'Error submitting the request.'));
                setStatus('error');
            }
        } catch {
            setErrorMsg(isEs ? 'Error de conexión. Intenta de nuevo.' : 'Connection error. Please try again.');
            setStatus('error');
        }
    };

    if (status === 'sent') {
        return (
            <div className={styles.landing} style={{ minHeight: '80vh', paddingTop: '100px' }}>
                <div className={styles.container} style={{ maxWidth: '640px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>✅</div>
                    <h1 className={styles.heroTitle} style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
                        {isEs ? 'Solicitud recibida' : 'Request received'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: 'var(--space-lg)' }}>
                        {isEs
                            ? 'Hemos recibido tu solicitud de ejercicio de derechos ARCO. Responderemos al correo electrónico que proporcionaste en un plazo máximo de 15 días hábiles.'
                            : 'We have received your ARCO rights request. We will respond to the email address you provided within a maximum of 15 business days.'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        {isEs
                            ? 'Si no recibes respuesta en ese plazo, escríbenos a contacto@sanemos.ai'
                            : 'If you do not receive a response within that period, write to us at contacto@sanemos.ai'}
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
                        {isEs ? '📋 Derechos ARCO' : '📋 ARCO Rights'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {isEs
                            ? 'Ejerce tus derechos de Acceso, Rectificación, Cancelación y Oposición sobre tus datos personales.'
                            : 'Exercise your rights of Access, Rectification, Cancellation, and Opposition over your personal data.'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        {isEs
                            ? 'De acuerdo con la Ley N° 19.628 sobre Protección de la Vida Privada (Chile).'
                            : 'In accordance with Law No. 19,628 on the Protection of Private Life (Chile).'}
                    </p>
                </div>

                {/* Info box */}
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
                        ? 'Responderemos tu solicitud en un plazo máximo de 15 días hábiles al correo electrónico que indiques. Para solicitudes de eliminación de cuenta, el proceso puede tomar hasta 30 días calendario.'
                        : 'We will respond to your request within a maximum of 15 business days to the email address you provide. For account deletion requests, the process may take up to 30 calendar days.'}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {/* Right type */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Tipo de derecho *' : 'Type of right *'}
                        </label>
                        <select
                            value={rightType}
                            onChange={e => setRightType(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-sm)',
                            }}
                        >
                            <option value="">{isEs ? 'Selecciona un tipo de solicitud' : 'Select request type'}</option>
                            {rightTypes.map(rt => (
                                <option key={rt.value} value={rt.value}>{rt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Nombre completo *' : 'Full name *'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            maxLength={200}
                            placeholder={isEs ? 'Tu nombre tal como aparece en tu cuenta' : 'Your name as it appears on your account'}
                            style={{
                                width: '100%',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-sm)',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Correo electrónico registrado *' : 'Registered email address *'}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder={isEs ? 'El correo con el que te registraste' : 'The email you registered with'}
                            style={{
                                width: '100%',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-sm)',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                            {isEs ? 'Descripción de tu solicitud *' : 'Description of your request *'}
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            maxLength={2000}
                            rows={5}
                            placeholder={isEs
                                ? 'Describe con detalle qué información quieres acceder, corregir o eliminar, o por qué te opones a cierto tratamiento...'
                                : 'Describe in detail what information you want to access, correct, or delete, or why you object to certain processing...'}
                            style={{
                                width: '100%',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-sm)',
                                resize: 'vertical',
                                minHeight: '120px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                            {description.length}/2000
                        </p>
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
                            : (isEs ? 'Enviar solicitud' : 'Submit request')}
                    </button>
                </form>

                <p style={{ marginTop: 'var(--space-xl)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.7' }}>
                    {isEs
                        ? 'También puedes enviar tu solicitud directamente a contacto@sanemos.ai indicando el tipo de derecho que deseas ejercer.'
                        : 'You can also send your request directly to contacto@sanemos.ai indicating the type of right you wish to exercise.'}
                </p>
            </div>
        </div>
    );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';

const COUNTRIES_ES = [
    {
        region: 'Cono Sur',
        countries: [
            {
                name: 'Chile',
                flag: '🇨🇱',
                lines: [
                    { label: 'Salud Mental (MINSAL)', number: '600 360 7777', note: 'Gratuito, 24 horas' },
                    { label: 'SAMU (emergencias médicas)', number: '131', note: '24 horas' },
                    { label: 'Carabineros', number: '133', note: '24 horas' },
                    { label: 'Fono Infancia (menores)', number: '147', note: 'SENAME, gratuito' },
                ],
            },
            {
                name: 'Argentina',
                flag: '🇦🇷',
                lines: [
                    { label: 'Centro de Asistencia al Suicida', number: '135', note: 'Gratuito, 24 horas' },
                    { label: 'SAME (emergencias)', number: '107', note: '24 horas' },
                    { label: 'Policía / Emergencias', number: '911', note: '24 horas' },
                ],
            },
            {
                name: 'Uruguay',
                flag: '🇺🇾',
                lines: [
                    { label: 'Línea de Crisis Emocional', number: '0800 0767', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                ],
            },
            {
                name: 'Paraguay',
                flag: '🇵🇾',
                lines: [
                    { label: 'SEME (emergencias médicas)', number: '141', note: '24 horas' },
                    { label: 'Policía', number: '911', note: '24 horas' },
                ],
            },
        ],
    },
    {
        region: 'América del Sur',
        countries: [
            {
                name: 'Brasil',
                flag: '🇧🇷',
                lines: [
                    { label: 'CVV (Centro de Valorização da Vida)', number: '188', note: 'Gratuito, 24 horas' },
                    { label: 'SAMU', number: '192', note: '24 horas' },
                    { label: 'Bombeiros', number: '193', note: '24 horas' },
                ],
            },
            {
                name: 'Colombia',
                flag: '🇨🇴',
                lines: [
                    { label: 'Línea de Salud Mental', number: '106', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '123', note: '24 horas' },
                    { label: 'Cruz Roja', number: '132', note: '24 horas' },
                ],
            },
            {
                name: 'Perú',
                flag: '🇵🇪',
                lines: [
                    { label: 'Línea de Salud (MINSA)', number: '113', note: 'Gratuito, 24 horas' },
                    { label: 'PNP (Policía)', number: '105', note: '24 horas' },
                    { label: 'SAMU', number: '117', note: '24 horas' },
                ],
            },
            {
                name: 'Ecuador',
                flag: '🇪🇨',
                lines: [
                    { label: 'Línea de Salud Mental', number: '171', note: 'Gratuito, 24 horas' },
                    { label: 'ECU 911 (emergencias)', number: '911', note: '24 horas' },
                ],
            },
            {
                name: 'Bolivia',
                flag: '🇧🇴',
                lines: [
                    { label: 'Policía', number: '110', note: '24 horas' },
                    { label: 'Bomberos', number: '119', note: '24 horas' },
                    { label: 'Cruz Roja', number: '165', note: '24 horas' },
                ],
            },
            {
                name: 'Venezuela',
                flag: '🇻🇪',
                lines: [
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                    { label: 'Cuerpo de Investigaciones (CICPC)', number: '0800 CICPC00', note: '24 horas' },
                ],
            },
        ],
    },
    {
        region: 'América Central y México',
        countries: [
            {
                name: 'México',
                flag: '🇲🇽',
                lines: [
                    { label: 'SAPTEL (crisis emocional)', number: '55 5259-8121', note: 'Gratuito, 24 horas' },
                    { label: 'Línea de la Vida (CONASAMA)', number: '800 290 0024', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                ],
            },
            {
                name: 'Guatemala',
                flag: '🇬🇹',
                lines: [
                    { label: 'Policía Nacional Civil', number: '110', note: '24 horas' },
                    { label: 'Bomberos Municipales', number: '122', note: '24 horas' },
                    { label: 'Cruz Roja', number: '125', note: '24 horas' },
                ],
            },
            {
                name: 'Costa Rica',
                flag: '🇨🇷',
                lines: [
                    { label: 'Línea de Ayuda Emocional (CCSS)', number: '800 911 9 911', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                ],
            },
            {
                name: 'Honduras',
                flag: '🇭🇳',
                lines: [
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                    { label: 'Cruz Roja', number: '195', note: '24 horas' },
                ],
            },
            {
                name: 'El Salvador',
                flag: '🇸🇻',
                lines: [
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                    { label: 'Cruz Roja', number: '222-5155', note: '24 horas' },
                ],
            },
            {
                name: 'Nicaragua',
                flag: '🇳🇮',
                lines: [
                    { label: 'Policía Nacional', number: '118', note: '24 horas' },
                    { label: 'Cruz Roja', number: '128', note: '24 horas' },
                ],
            },
            {
                name: 'Panamá',
                flag: '🇵🇦',
                lines: [
                    { label: 'Sistema de Emergencias Nacional', number: '911', note: '24 horas' },
                    { label: 'SUME (urgencias médicas)', number: '269-9778', note: '24 horas' },
                ],
            },
        ],
    },
    {
        region: 'Caribe',
        countries: [
            {
                name: 'Cuba',
                flag: '🇨🇺',
                lines: [
                    { label: 'Emergencias médicas', number: '104', note: '24 horas' },
                    { label: 'Policía', number: '106', note: '24 horas' },
                ],
            },
            {
                name: 'República Dominicana',
                flag: '🇩🇴',
                lines: [
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                    { label: 'Cruz Roja', number: '809 200-0111', note: '24 horas' },
                ],
            },
            {
                name: 'Puerto Rico (EE.UU.)',
                flag: '🇵🇷',
                lines: [
                    { label: '988 Suicide & Crisis Lifeline', number: '988', note: 'Gratuito, 24 horas, español disponible' },
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                ],
            },
        ],
    },
    {
        region: 'América del Norte',
        countries: [
            {
                name: 'Estados Unidos',
                flag: '🇺🇸',
                lines: [
                    { label: '988 Suicide & Crisis Lifeline', number: '988', note: 'Gratuito, 24 horas. Español: pulsa 2' },
                    { label: 'Crisis Text Line', number: 'Text HOME to 741741', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                ],
            },
            {
                name: 'Canadá',
                flag: '🇨🇦',
                lines: [
                    { label: 'Suicide Crisis Helpline', number: '988', note: 'Gratuito, 24 horas' },
                    { label: 'Crisis Services Canada', number: '1-833-456-4566', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '911', note: '24 horas' },
                ],
            },
        ],
    },
    {
        region: 'España',
        countries: [
            {
                name: 'España',
                flag: '🇪🇸',
                lines: [
                    { label: 'Teléfono de la Esperanza', number: '717 003 717', note: 'Gratuito, 24 horas' },
                    { label: 'Teléfono contra el Suicidio', number: '024', note: 'Gratuito, 24 horas' },
                    { label: 'Emergencias', number: '112', note: '24 horas' },
                ],
            },
        ],
    },
];

const COUNTRIES_EN = [
    {
        region: 'Southern Cone',
        countries: [
            {
                name: 'Chile',
                flag: '🇨🇱',
                lines: [
                    { label: 'Mental Health Line (MINSAL)', number: '600 360 7777', note: 'Free, 24 hours' },
                    { label: 'SAMU (medical emergencies)', number: '131', note: '24 hours' },
                    { label: 'Carabineros (police)', number: '133', note: '24 hours' },
                    { label: 'Child Helpline (SENAME)', number: '147', note: 'Free' },
                ],
            },
            {
                name: 'Argentina',
                flag: '🇦🇷',
                lines: [
                    { label: 'Suicide Assistance Center', number: '135', note: 'Free, 24 hours' },
                    { label: 'SAME (emergencies)', number: '107', note: '24 hours' },
                    { label: 'Police / Emergencies', number: '911', note: '24 hours' },
                ],
            },
            {
                name: 'Uruguay',
                flag: '🇺🇾',
                lines: [
                    { label: 'Emotional Crisis Line', number: '0800 0767', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
            {
                name: 'Paraguay',
                flag: '🇵🇾',
                lines: [
                    { label: 'SEME (medical emergencies)', number: '141', note: '24 hours' },
                    { label: 'Police', number: '911', note: '24 hours' },
                ],
            },
        ],
    },
    {
        region: 'South America',
        countries: [
            {
                name: 'Brazil',
                flag: '🇧🇷',
                lines: [
                    { label: 'CVV (Life Appreciation Center)', number: '188', note: 'Free, 24 hours' },
                    { label: 'SAMU', number: '192', note: '24 hours' },
                    { label: 'Bombeiros (fire / rescue)', number: '193', note: '24 hours' },
                ],
            },
            {
                name: 'Colombia',
                flag: '🇨🇴',
                lines: [
                    { label: 'Mental Health Line', number: '106', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '123', note: '24 hours' },
                    { label: 'Red Cross', number: '132', note: '24 hours' },
                ],
            },
            {
                name: 'Peru',
                flag: '🇵🇪',
                lines: [
                    { label: 'Health Line (MINSA)', number: '113', note: 'Free, 24 hours' },
                    { label: 'PNP (Police)', number: '105', note: '24 hours' },
                    { label: 'SAMU', number: '117', note: '24 hours' },
                ],
            },
            {
                name: 'Ecuador',
                flag: '🇪🇨',
                lines: [
                    { label: 'Mental Health Line', number: '171', note: 'Free, 24 hours' },
                    { label: 'ECU 911 (emergencies)', number: '911', note: '24 hours' },
                ],
            },
            {
                name: 'Bolivia',
                flag: '🇧🇴',
                lines: [
                    { label: 'Police', number: '110', note: '24 hours' },
                    { label: 'Fire Department', number: '119', note: '24 hours' },
                    { label: 'Red Cross', number: '165', note: '24 hours' },
                ],
            },
            {
                name: 'Venezuela',
                flag: '🇻🇪',
                lines: [
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
        ],
    },
    {
        region: 'Central America & Mexico',
        countries: [
            {
                name: 'Mexico',
                flag: '🇲🇽',
                lines: [
                    { label: 'SAPTEL (emotional crisis)', number: '55 5259-8121', note: 'Free, 24 hours' },
                    { label: 'Línea de la Vida (CONASAMA)', number: '800 290 0024', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
            {
                name: 'Guatemala',
                flag: '🇬🇹',
                lines: [
                    { label: 'National Civil Police', number: '110', note: '24 hours' },
                    { label: 'Fire Department', number: '122', note: '24 hours' },
                    { label: 'Red Cross', number: '125', note: '24 hours' },
                ],
            },
            {
                name: 'Costa Rica',
                flag: '🇨🇷',
                lines: [
                    { label: 'Emotional Support Line (CCSS)', number: '800 911 9 911', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
            {
                name: 'Honduras',
                flag: '🇭🇳',
                lines: [
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                    { label: 'Red Cross', number: '195', note: '24 hours' },
                ],
            },
            {
                name: 'El Salvador',
                flag: '🇸🇻',
                lines: [
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                    { label: 'Red Cross', number: '222-5155', note: '24 hours' },
                ],
            },
            {
                name: 'Nicaragua',
                flag: '🇳🇮',
                lines: [
                    { label: 'National Police', number: '118', note: '24 hours' },
                    { label: 'Red Cross', number: '128', note: '24 hours' },
                ],
            },
            {
                name: 'Panama',
                flag: '🇵🇦',
                lines: [
                    { label: 'National Emergency System', number: '911', note: '24 hours' },
                    { label: 'SUME (medical emergencies)', number: '269-9778', note: '24 hours' },
                ],
            },
        ],
    },
    {
        region: 'Caribbean',
        countries: [
            {
                name: 'Cuba',
                flag: '🇨🇺',
                lines: [
                    { label: 'Medical emergencies', number: '104', note: '24 hours' },
                    { label: 'Police', number: '106', note: '24 hours' },
                ],
            },
            {
                name: 'Dominican Republic',
                flag: '🇩🇴',
                lines: [
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                    { label: 'Red Cross', number: '809 200-0111', note: '24 hours' },
                ],
            },
            {
                name: 'Puerto Rico (USA)',
                flag: '🇵🇷',
                lines: [
                    { label: '988 Suicide & Crisis Lifeline', number: '988', note: 'Free, 24 hours. Spanish available' },
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
        ],
    },
    {
        region: 'North America',
        countries: [
            {
                name: 'United States',
                flag: '🇺🇸',
                lines: [
                    { label: '988 Suicide & Crisis Lifeline', number: '988', note: 'Free, 24 hours. Spanish: press 2' },
                    { label: 'Crisis Text Line', number: 'Text HOME to 741741', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
            {
                name: 'Canada',
                flag: '🇨🇦',
                lines: [
                    { label: 'Suicide Crisis Helpline', number: '988', note: 'Free, 24 hours' },
                    { label: 'Crisis Services Canada', number: '1-833-456-4566', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '911', note: '24 hours' },
                ],
            },
        ],
    },
    {
        region: 'Spain',
        countries: [
            {
                name: 'Spain',
                flag: '🇪🇸',
                lines: [
                    { label: 'Teléfono de la Esperanza', number: '717 003 717', note: 'Free, 24 hours' },
                    { label: 'Suicide Prevention Line', number: '024', note: 'Free, 24 hours' },
                    { label: 'Emergencies', number: '112', note: '24 hours' },
                ],
            },
        ],
    },
];

export default function CrisisPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const isEs = locale === 'es';

    const regions = isEs ? COUNTRIES_ES : COUNTRIES_EN;

    return (
        <div style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: 'var(--space-3xl)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 var(--space-md)' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🆘</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                        {isEs ? 'Líneas de Crisis y Emergencias' : 'Crisis & Emergency Lines'}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.75', maxWidth: '600px', margin: '0 auto' }}>
                        {isEs
                            ? 'Si estás en una situación de crisis, no estás solo/a. Llama a la línea de tu país — son gratuitas, confidenciales y están disponibles las 24 horas.'
                            : 'If you are in a crisis situation, you are not alone. Call the line in your country — they are free, confidential, and available 24 hours a day.'}
                    </p>

                    {/* Urgent banner */}
                    <div style={{
                        marginTop: 'var(--space-xl)',
                        padding: 'var(--space-md) var(--space-lg)',
                        background: 'rgba(196, 125, 138, 0.1)',
                        border: '2px solid rgba(196, 125, 138, 0.4)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'inline-block',
                    }}>
                        <p style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.05rem', margin: 0 }}>
                            {isEs
                                ? '⚠️ Si hay peligro inmediato de vida, llama al número de emergencias de tu país ahora.'
                                : '⚠️ If there is immediate danger to life, call your country\'s emergency number now.'}
                        </p>
                    </div>
                </div>

                {/* Regions */}
                {regions.map((region, rIdx) => (
                    <section key={rIdx} style={{ marginBottom: 'var(--space-3xl)' }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-lg)',
                            paddingBottom: 'var(--space-sm)',
                            borderBottom: '2px solid var(--primary)',
                            display: 'inline-block',
                        }}>
                            {region.region}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-md)' }}>
                            {region.countries.map((country, cIdx) => (
                                <div key={cIdx} style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-lg)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: '700',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--space-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                    }}>
                                        <span style={{ fontSize: '1.4rem' }}>{country.flag}</span>
                                        {country.name}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        {country.lines.map((line, lIdx) => (
                                            <div key={lIdx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: 'var(--space-sm)',
                                                padding: 'var(--space-sm) 0',
                                                borderBottom: lIdx < country.lines.length - 1 ? '1px solid var(--border-light)' : 'none',
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                                                        {line.label}
                                                    </p>
                                                    {line.note && (
                                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: '1.3' }}>
                                                            {line.note}
                                                        </p>
                                                    )}
                                                </div>
                                                <a
                                                    href={`tel:${line.number.replace(/\s/g, '')}`}
                                                    style={{
                                                        fontWeight: '700',
                                                        fontSize: '0.95rem',
                                                        color: 'var(--primary)',
                                                        textDecoration: 'none',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {line.number}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Footer note */}
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-xl)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    marginTop: 'var(--space-xl)',
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.7', marginBottom: 'var(--space-md)' }}>
                        {isEs
                            ? 'Esta lista se actualiza periódicamente. Si conoces una línea de crisis que no está aquí, escríbenos a contacto@sanemos.ai para agregarla.'
                            : 'This list is updated periodically. If you know a crisis line that is not listed here, write to us at contacto@sanemos.ai to add it.'}
                    </p>
                    <button className="btn btn-secondary" onClick={() => router.back()}>
                        {isEs ? 'Volver' : 'Go back'}
                    </button>
                </div>
            </div>
        </div>
    );
}

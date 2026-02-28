'use client';

import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

const RULES_ES = [
    {
        title: 'Respeto y trato digno',
        desc: 'Trata a cada persona con amabilidad y empatía. No se tolerará ninguna forma de acoso, insultos, discriminación por género, orientación sexual, religión, nacionalidad, raza, discapacidad ni cualquier otra característica personal. Los desacuerdos se expresan con respeto.',
    },
    {
        title: 'Espacio seguro y contenido sensible',
        desc: 'Este es un lugar de sanación. Si compartes experiencias dolorosas, considera usar advertencias de contenido (ej. "CW: autolesión") para que otros puedan prepararse. Evita describir métodos de autolesión o suicidio de forma explícita o detallada.',
    },
    {
        title: 'Protocolo de crisis',
        desc: 'Si tú o alguien en la comunidad está en peligro inmediato, comunícate de inmediato con los servicios de emergencia. En Chile: SAMU 131, Carabineros 133. Línea de Salud Mental (MINSAL): 600 360 7777. Los compañeros de IA y los miembros de la comunidad no pueden actuar como servicio de emergencia.',
    },
    {
        title: 'Sin asesoramiento médico',
        desc: 'La comunidad ofrece apoyo emocional entre pares, no asesoramiento médico, psicológico ni psiquiátrico profesional. No des ni solicites diagnósticos, ni recomiendes o desaconsejes medicamentos. Si necesitas atención clínica, consulta a un profesional de salud.',
    },
    {
        title: 'Privacidad y confidencialidad',
        desc: 'Protege la privacidad de los demás. No compartas datos personales de otros usuarios (nombre completo, dirección, teléfono, etc.) sin su consentimiento. No captures ni difundas conversaciones privadas de la plataforma.',
    },
    {
        title: 'Sin publicidad ni spam',
        desc: 'No uses sanemos.ai para fines comerciales, publicitar productos o servicios, enviar spam ni captar clientes o seguidores. Los terapeutas pueden usar únicamente los canales habilitados para crear su perfil profesional.',
    },
    {
        title: 'Contenido apropiado',
        desc: 'Está prohibido publicar contenido sexual explícito, violento, que promueva actividades ilegales o que infrinja derechos de autor o propiedad intelectual de terceros.',
    },
    {
        title: 'Uso de los compañeros de IA',
        desc: 'Los compañeros de IA (Luna, Marco, Serena, Alma y Faro) están diseñados para brindar apoyo emocional y compañía. No son psicólogos, médicos ni consejeros profesionales. Sus respuestas no reemplazan la atención clínica. No compartas información urgente esperando que actúen como servicio de emergencia.',
    },
    {
        title: 'Denuncias',
        desc: 'Si ves contenido que viola estas normas, usa la función de reporte para notificarlo al equipo de moderación. No respondas con más contenido dañino.',
    },
    {
        title: 'Consecuencias',
        desc: 'El incumplimiento puede resultar en: (1) Advertencia — recordatorio de las normas. (2) Strike — registro formal de infracción. (3) Suspensión temporal — bloqueo por tiempo determinado. (4) Eliminación permanente de la cuenta — infracción grave o acumulación de strikes. sanemos.ai se reserva el derecho de moderar contenido y cuentas para proteger el bienestar de la comunidad.',
    },
];

const RULES_EN = [
    {
        title: 'Respect and Dignity',
        desc: 'Treat every person with kindness and empathy. No form of harassment, insults, or discrimination based on gender, sexual orientation, religion, nationality, race, disability, or any other personal characteristic will be tolerated. Disagreements must be expressed respectfully.',
    },
    {
        title: 'Safe Space and Sensitive Content',
        desc: 'This is a place for healing. If you share painful experiences, consider using content warnings (e.g., "CW: self-harm") so others can prepare themselves. Avoid describing methods of self-harm or suicide in explicit or detailed terms.',
    },
    {
        title: 'Crisis Protocol',
        desc: 'If you or someone in the community is in immediate danger, contact emergency services right away. In Chile: SAMU 131, Carabineros 133. Mental Health Line (MINSAL): 600 360 7777. AI companions and community members cannot act as emergency services.',
    },
    {
        title: 'No Medical Advice',
        desc: 'This community offers peer emotional support, not professional medical, psychological, or psychiatric advice. Do not give or request diagnoses, and do not recommend or discourage medications. If you need clinical care, please consult a health professional.',
    },
    {
        title: 'Privacy and Confidentiality',
        desc: 'Protect the privacy of others. Do not share personal information of other users (full name, address, phone number, etc.) without their consent. Do not capture or share private conversations from the platform.',
    },
    {
        title: 'No Advertising or Spam',
        desc: 'Do not use sanemos.ai for commercial purposes, advertising products or services, sending spam, or recruiting clients or followers. Therapists may only use the designated channels to create their professional profiles.',
    },
    {
        title: 'Appropriate Content',
        desc: 'Posting explicit sexual or violent content, content promoting illegal activities, or content that infringes on third-party copyrights or intellectual property is prohibited.',
    },
    {
        title: 'Use of AI Companions',
        desc: 'AI companions (Luna, Marco, Serena, Alma, and Faro) are designed to provide emotional support and companionship. They are not psychologists, doctors, or professional counselors. Their responses do not replace clinical care. Do not share urgent information expecting them to act as emergency services.',
    },
    {
        title: 'Reporting',
        desc: 'If you see content that violates these guidelines, use the report feature to notify the moderation team. Do not respond with more harmful content.',
    },
    {
        title: 'Consequences',
        desc: 'Non-compliance may result in: (1) Warning — a reminder of the guidelines. (2) Strike — a formal record of the violation. (3) Temporary suspension — access blocked for a set period. (4) Permanent account removal — for serious violations or accumulated strikes. sanemos.ai reserves the right to moderate content and accounts to protect the well-being of the community.',
    },
];

export default function RulesPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const isEs = locale === 'es';

    const rules = isEs ? RULES_ES : RULES_EN;

    return (
        <div className={styles.landing} style={{ minHeight: '80vh', paddingTop: '100px' }}>
            <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-md)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem' }}>
                        {isEs ? 'Normas de la Comunidad' : 'Community Guidelines'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {isEs
                            ? 'sanemos.ai es un espacio de apoyo emocional para personas que atraviesan el duelo. Para mantenerlo seguro y acogedor, todos los miembros deben respetar estas normas.'
                            : 'sanemos.ai is an emotional support space for people going through grief. To keep it safe and welcoming, all members must follow these guidelines.'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        {isEs ? 'Última actualización: 28 de febrero de 2026' : 'Last updated: February 28, 2026'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {rules.map((rule, idx) => (
                        <div key={idx} style={{
                            background: 'var(--surface)',
                            padding: 'var(--space-lg)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                    flexShrink: 0,
                                }}>
                                    {idx + 1}
                                </span>
                                {rule.title}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginLeft: '40px' }}>{rule.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: 'var(--space-2xl)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    textAlign: 'center',
                }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: 'var(--space-md)' }}>
                        {isEs
                            ? 'Al registrarte en sanemos.ai, aceptas cumplir estas normas. Cualquier conducta que ponga en riesgo el bienestar de la comunidad será tratada según el protocolo de moderación descrito arriba.'
                            : 'By registering on sanemos.ai, you agree to comply with these guidelines. Any conduct that endangers the well-being of the community will be handled according to the moderation protocol described above.'}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push(`/${locale}`)}
                        >
                            {isEs ? 'Volver al Inicio' : 'Back to Home'}
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push(`/${locale}/terms`)}
                        >
                            {isEs ? 'Ver Términos y Condiciones' : 'View Terms & Conditions'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

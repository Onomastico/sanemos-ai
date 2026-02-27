'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

export default function RulesPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const rules = locale === 'es' ? [
        { title: 'Respeto Obligatorio', desc: 'Trata a todos con amabilidad. No se tolerará acoso, discursos de odio ni discriminación.' },
        { title: 'Espacio Seguro', desc: 'Este es un lugar de sanación. Evita compartir detalles explícitos o gráficos que puedan herir a otros sin advertencia previa.' },
        { title: 'Cero Publicidad', desc: 'No uses la comunidad para vender productos, servicios o promocionarte.' },
        { title: 'Privacidad Ante Todo', desc: 'No compartas información personal de otros usuarios ni capturas de pantalla de conversaciones privadas.' },
        { title: 'Sin Consejos Médicos', desc: 'La comunidad brinda apoyo emocional, no asesoramiento médico o psicológico profesional. Consulta a un experto si estás en crisis.' }
    ] : [
        { title: 'Mandatory Respect', desc: 'Treat everyone with kindness. Harassment, hate speech, or discrimination will not be tolerated.' },
        { title: 'Safe Space', desc: 'This is a place for healing. Avoid sharing explicit or graphic details that might trigger others without a prior warning.' },
        { title: 'No Advertising', desc: 'Do not use the community to sell products, services, or promote yourself.' },
        { title: 'Privacy First', desc: 'Do not share personal information of other users or screenshots of private conversations.' },
        { title: 'No Medical Advice', desc: 'The community provides emotional support, not professional medical or psychological advice. Consult an expert if in crisis.' }
    ];

    return (
        <div className={styles.landing} style={{ minHeight: '80vh', paddingTop: 'var(--header-height)' }}>
            <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-md)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem' }}>
                        {locale === 'es' ? 'Normas de la Comunidad' : 'Community Rules'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {locale === 'es'
                            ? 'Para mantener este espacio seguro y acogedor, pedimos a todos los miembros que sigan estas reglas fundamentales.'
                            : 'To keep this space safe and welcoming, we ask all members to follow these fundamental rules.'}
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
                                <span style={{ background: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{idx + 1}</span>
                                {rule.title}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginLeft: '36px' }}>{rule.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
                        {locale === 'es'
                            ? 'El incumplimiento de estas normas resultará en la acumulación de "strikes", lo que puede llevar a la suspensión o eliminación permanente de la cuenta.'
                            : 'Failure to comply with these rules will result in the accumulation of "strikes", which may lead to account suspension or permanent termination.'}
                    </p>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push(`/${locale}`)}
                    >
                        {locale === 'es' ? 'Volver al Inicio' : 'Back to Home'}
                    </button>
                </div>
            </div>
        </div>
    );
}

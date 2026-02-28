'use client';

import { usePathname } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

// Replace with your actual Ko-fi page (connect PayPal when setting it up — Stripe is not available in Chile):
// https://ko-fi.com/YOUR_USERNAME
const KOFI_URL = 'https://ko-fi.com/sanemosai';

// Replace with your Mercado Pago payment link (mercadopago.cl → Cobrar → Link de pago):
// https://mpago.la/XXXXXXX
const MERCADOPAGO_URL = 'https://link.mercadopago.cl/sanemosai';

const CONTENT_ES = {
    title: 'Apoya a sanemos.ai',
    subtitle: 'sanemos.ai nació de la convicción de que nadie debería atravesar el duelo en soledad. Gracias a personas como tú, podemos mantener este espacio abierto, seguro y sin costo para quienes más lo necesitan.',
    whyTitle: '¿Por qué donar?',
    whyItems: [
        {
            icon: '🤖',
            title: 'Mantener los compañeros de IA activos',
            desc: 'Cada conversación con Luna, Marco, Serena, Alma o Faro tiene un costo de procesamiento. Tu apoyo nos permite seguir ofreciéndolas sin cobrar a los usuarios.',
        },
        {
            icon: '🏗️',
            title: 'Desarrollo y mejoras continuas',
            desc: 'Nuevas funciones, más idiomas, mejor experiencia — todo requiere tiempo y recursos.',
        },
        {
            icon: '🔒',
            title: 'Infraestructura segura',
            desc: 'Servidores, bases de datos y seguridad de datos para proteger la privacidad de cada persona que confía en nosotros.',
        },
        {
            icon: '💚',
            title: 'Acceso gratuito para todos',
            desc: 'Creemos que el apoyo emocional no debería estar detrás de un muro de pago. Las donaciones hacen posible que sanemos.ai sea gratis.',
        },
    ],
    kofiButton: 'Apoyar en Ko-fi',
    mercadopagoButton: 'Donar con Mercado Pago',
    methodsNote: 'Ko-fi acepta tarjetas internacionales y PayPal · Mercado Pago para pagos desde Chile',
    amountsTitle: 'Cada aporte cuenta',
    amounts: [
        { amount: '$2 USD', desc: 'Una semana de conversaciones con compañeros de IA para un usuario.' },
        { amount: '$5 USD', desc: 'Un mes de acceso completo para una persona en duelo.' },
        { amount: '$15 USD', desc: 'Cubre los costos de infraestructura por un día completo.' },
        { amount: 'Lo que puedas', desc: 'Cualquier monto es bienvenido y significativo.' },
    ],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
        {
            q: '¿Es obligatorio donar para usar sanemos.ai?',
            a: 'No. sanemos.ai es y seguirá siendo completamente gratuito. Las donaciones son voluntarias y nos ayudan a crecer y mejorar.',
        },
        {
            q: '¿Puedo hacer una donación mensual?',
            a: 'Sí. Ko-fi permite configurar una donación mensual recurrente desde tu cuenta. Mercado Pago por ahora solo acepta pagos únicos.',
        },
        {
            q: '¿La donación es deducible de impuestos?',
            a: 'Por ahora, sanemos.ai opera sin personería jurídica formal, por lo que las donaciones no son deducibles tributariamente. Estamos trabajando en formalizar el proyecto.',
        },
        {
            q: '¿Cómo se usan los fondos?',
            a: 'Exclusivamente para costos operativos: APIs de IA, servidores, dominio y desarrollo. No hay salarios pagados actualmente.',
        },
    ],
    thankYou: 'Gracias por creer en este proyecto y en las personas que lo necesitan.',
};

const CONTENT_EN = {
    title: 'Support sanemos.ai',
    subtitle: 'sanemos.ai was born from the belief that no one should go through grief alone. Thanks to people like you, we can keep this space open, safe, and free for those who need it most.',
    whyTitle: 'Why donate?',
    whyItems: [
        {
            icon: '🤖',
            title: 'Keep AI companions running',
            desc: 'Every conversation with Luna, Marco, Serena, Alma, or Faro has a processing cost. Your support lets us keep offering them without charging users.',
        },
        {
            icon: '🏗️',
            title: 'Continuous development',
            desc: 'New features, more languages, better experience — all of it requires time and resources.',
        },
        {
            icon: '🔒',
            title: 'Secure infrastructure',
            desc: 'Servers, databases, and data security to protect the privacy of everyone who trusts us.',
        },
        {
            icon: '💚',
            title: 'Free access for everyone',
            desc: 'We believe emotional support shouldn\'t be behind a paywall. Donations make it possible for sanemos.ai to remain free.',
        },
    ],
    kofiButton: 'Support on Ko-fi',
    mercadopagoButton: 'Donate with Mercado Pago',
    methodsNote: 'Ko-fi accepts international cards and PayPal · Mercado Pago for payments from Chile',
    amountsTitle: 'Every contribution matters',
    amounts: [
        { amount: '$2 USD', desc: 'One week of AI companion conversations for a user.' },
        { amount: '$5 USD', desc: 'One month of full access for someone going through grief.' },
        { amount: '$15 USD', desc: 'Covers full infrastructure costs for one day.' },
        { amount: 'Whatever you can', desc: 'Any amount is welcome and meaningful.' },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
        {
            q: 'Is donating required to use sanemos.ai?',
            a: 'No. sanemos.ai is and will remain completely free. Donations are voluntary and help us grow and improve.',
        },
        {
            q: 'Can I set up a monthly donation?',
            a: 'Yes. Ko-fi lets you configure a recurring monthly donation from your account. Mercado Pago currently only supports one-time payments.',
        },
        {
            q: 'Is the donation tax-deductible?',
            a: 'For now, sanemos.ai operates without formal legal status, so donations are not tax-deductible. We are working on formalizing the project.',
        },
        {
            q: 'How are funds used?',
            a: 'Exclusively for operational costs: AI APIs, servers, domain, and development. There are no paid salaries at this time.',
        },
    ],
    thankYou: 'Thank you for believing in this project and in the people who need it.',
};

export default function DonatePage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'en';
    const isEs = locale === 'es';
    const c = isEs ? CONTENT_ES : CONTENT_EN;

    return (
        <div style={{ minHeight: '80vh', paddingTop: 'var(--header-height)' }}>
            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary-soft, rgba(196,125,138,0.08)) 0%, var(--surface) 100%)',
                borderBottom: '1px solid var(--border)',
                padding: 'var(--space-3xl) var(--space-md)',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>💚</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                        {c.title}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.75' }}>
                        {c.subtitle}
                    </p>

                    <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href={KOFI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-lg"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
                            </svg>
                            {c.kofiButton}
                        </a>
                        {MERCADOPAGO_URL && (
                            <a
                                href={MERCADOPAGO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-lg"
                                style={{ textDecoration: 'none' }}
                            >
                                {c.mercadopagoButton}
                            </a>
                        )}
                    </div>
                    <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {c.methodsNote}
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-3xl) var(--space-md)' }}>

                {/* Why donate */}
                <section style={{ marginBottom: 'var(--space-3xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
                        {c.whyTitle}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
                        {c.whyItems.map((item, idx) => (
                            <div key={idx} style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-lg)',
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>{item.icon}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                                    {item.title}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Reference amounts */}
                <section style={{ marginBottom: 'var(--space-3xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
                        {c.amountsTitle}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {c.amounts.map((row, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-lg)',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-md) var(--space-lg)',
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    color: 'var(--primary)',
                                    minWidth: '110px',
                                    flexShrink: 0,
                                }}>
                                    {row.amount}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>
                                    {row.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href={KOFI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ textDecoration: 'none' }}
                        >
                            {c.kofiButton}
                        </a>
                        {MERCADOPAGO_URL && (
                            <a
                                href={MERCADOPAGO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ textDecoration: 'none' }}
                            >
                                {c.mercadopagoButton}
                            </a>
                        )}
                    </div>
                </section>

                {/* FAQ */}
                <section style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
                        {c.faqTitle}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {c.faqs.map((faq, idx) => (
                            <div key={idx} style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-lg)',
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                                    {faq.q}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.65' }}>
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Thank you */}
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                    {c.thankYou}
                </div>
            </div>
        </div>
    );
}

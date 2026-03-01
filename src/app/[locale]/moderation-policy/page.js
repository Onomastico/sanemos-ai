'use client';

import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

const SECTIONS_ES = [
    {
        title: '1. Propósito de la Moderación',
        content: `sanemos.ai es un espacio de apoyo emocional para personas en duelo. La moderación existe para mantener un entorno seguro, compasivo y respetuoso donde todas las personas puedan compartir y buscar apoyo sin temor a daño, acoso o desinformación.\n\nNuestro objetivo no es censurar el dolor ni las experiencias difíciles — el duelo puede ser oscuro, y eso es válido. Moderamos para proteger, no para silenciar.`,
    },
    {
        title: '2. Contenido No Permitido',
        content: `Las siguientes categorías de contenido son eliminadas o bloqueadas:\n\n• Discurso de odio o discriminación basada en raza, género, orientación sexual, religión, nacionalidad, discapacidad u otras características protegidas.\n• Acoso, amenazas o intimidación dirigidas a otros usuarios.\n• Contenido que promueva activamente la autolesión o el suicidio (se distingue de la expresión de dolor o pensamiento suicida, que recibe apoyo y derivación).\n• Desinformación peligrosa sobre salud mental, tratamientos médicos o emergencias.\n• Publicidad comercial no autorizada, spam o promoción encubierta de servicios.\n• Contenido sexual explícito o no solicitado.\n• Información personal de terceros sin su consentimiento (doxing).\n• Código malicioso o intentos de phishing.`,
    },
    {
        title: '3. Proceso de Moderación',
        content: `Utilizamos una combinación de moderación automatizada y humana:\n\n• Moderación automatizada por IA: el contenido publicado (cartas comunitarias, entradas de diario compartidas, recursos) pasa por un sistema de revisión automática que evalúa si cumple con las normas. Si el sistema tiene alta confianza en que el contenido es apropiado, se publica directamente. Si hay dudas, queda en revisión humana.\n• Revisión humana: el equipo de moderación revisa el contenido marcado por el sistema o denunciado por usuarios. Respondemos en un plazo de 48 horas hábiles para la mayoría de los casos.\n• Moderación de conversaciones con IA: las conversaciones con los compañeros de IA también pasan por una capa de moderación que bloquea contenido perjudicial en tiempo real.`,
    },
    {
        title: '4. Escala de Sanciones',
        content: `Las sanciones se aplican de forma progresiva y proporcional a la gravedad de la infracción:\n\n• Advertencia: para infracciones leves o primeras transgresiones sin intención clara de daño.\n• Strike (aviso formal): el contenido infractor es eliminado y el usuario recibe una notificación con la razón. Tres strikes acumulados pueden resultar en suspensión.\n• Suspensión temporal: acceso restringido a funciones por un período determinado (7 a 30 días según la gravedad).\n• Suspensión permanente: para infracciones graves o reiteradas, como acoso sistemático, promoción activa de autolesión, o intentos de evadir sanciones previas.\n\nEn casos de peligro inmediato (contenido que indica crisis activa de suicidio u otros), el equipo también ofrece derivación a recursos de apoyo antes de aplicar cualquier sanción.`,
    },
    {
        title: '5. Cómo Denunciar Contenido',
        content: `Cualquier usuario puede reportar contenido que considere problemático:\n\n• En el chat con compañeros de IA: usa el botón ⚑ en la parte superior del chat.\n• En cartas de la comunidad, recursos o comentarios: usa el botón de denuncia disponible en cada elemento.\n• Para reportes generales: usa el formulario en contacto@sanemos.ai o escribe directamente a nuestro equipo.\n\nTodos los reportes son anónimos frente al usuario denunciado. Nuestro equipo los revisa en un plazo máximo de 48 horas hábiles.`,
    },
    {
        title: '6. Proceso de Apelación',
        content: `Si crees que una decisión de moderación fue incorrecta, tienes derecho a apelarla:\n\n1. Escribe a contacto@sanemos.ai indicando: tu nombre de pantalla, el contenido o acción afectada, y los motivos de la apelación.\n2. Recibirás una respuesta en un plazo de 5 días hábiles.\n3. Las apelaciones son revisadas por un miembro del equipo distinto al que tomó la decisión original.\n4. Si la apelación es válida, la sanción se revoca o reduce. Si no lo es, se explican los motivos.\n\nEn el futuro, habilitaremos un formulario de apelación en la plataforma para facilitar este proceso.`,
    },
    {
        title: '7. Transparencia y Estadísticas',
        content: `Nos comprometemos a publicar periódicamente informes de transparencia que incluyan:\n\n• Número de contenidos revisados por período.\n• Número de sanciones aplicadas por categoría.\n• Tiempo promedio de resolución de denuncias.\n• Cambios significativos en las políticas de moderación.\n\nEstos informes estarán disponibles en la plataforma cuando alcancemos el volumen de actividad necesario para que los datos sean significativos.`,
    },
    {
        title: '8. Contacto del Equipo de Moderación',
        content: `Para cualquier consulta relacionada con moderación:\n\nCorreo: contacto@sanemos.ai\nTiempo de respuesta: máximo 48 horas hábiles\n\nSi el contenido implica un riesgo inmediato para la vida de una persona, contacta primero a los servicios de emergencia de tu país.`,
    },
];

const SECTIONS_EN = [
    {
        title: '1. Purpose of Moderation',
        content: `sanemos.ai is an emotional support space for people in grief. Moderation exists to maintain a safe, compassionate, and respectful environment where everyone can share and seek support without fear of harm, harassment, or misinformation.\n\nOur goal is not to censor pain or difficult experiences — grief can be dark, and that is valid. We moderate to protect, not to silence.`,
    },
    {
        title: '2. Content Not Permitted',
        content: `The following categories of content are removed or blocked:\n\n• Hate speech or discrimination based on race, gender, sexual orientation, religion, nationality, disability, or other protected characteristics.\n• Harassment, threats, or intimidation directed at other users.\n• Content that actively promotes self-harm or suicide (this is distinguished from the expression of pain or suicidal thoughts, which receives support and referral).\n• Dangerous misinformation about mental health, medical treatments, or emergencies.\n• Unauthorized commercial advertising, spam, or covert promotion of services.\n• Explicit or unsolicited sexual content.\n• Personal information about third parties without their consent (doxing).\n• Malicious code or phishing attempts.`,
    },
    {
        title: '3. Moderation Process',
        content: `We use a combination of automated and human moderation:\n\n• AI automated moderation: content published (community letters, shared journal entries, resources) goes through an automatic review system that evaluates whether it complies with the guidelines. If the system has high confidence that the content is appropriate, it is published directly. If there are doubts, it goes to human review.\n• Human review: the moderation team reviews content flagged by the system or reported by users. We respond within 48 business hours for most cases.\n• AI conversation moderation: conversations with AI companions also pass through a moderation layer that blocks harmful content in real time.`,
    },
    {
        title: '4. Sanctions Scale',
        content: `Sanctions are applied progressively and proportionally to the severity of the violation:\n\n• Warning: for minor violations or first-time transgressions without clear intent to harm.\n• Strike (formal notice): the offending content is removed and the user receives a notification with the reason. Three accumulated strikes may result in suspension.\n• Temporary suspension: restricted access to features for a specified period (7 to 30 days depending on severity).\n• Permanent suspension: for serious or repeated violations, such as systematic harassment, active promotion of self-harm, or attempts to circumvent prior sanctions.\n\nIn cases of immediate danger (content indicating an active suicide crisis or similar), the team also offers referral to support resources before applying any sanction.`,
    },
    {
        title: '5. How to Report Content',
        content: `Any user can report content they consider problematic:\n\n• In AI companion chats: use the ⚑ button at the top of the chat.\n• In community letters, resources, or comments: use the report button available on each item.\n• For general reports: use the form at contacto@sanemos.ai or write directly to our team.\n\nAll reports are anonymous to the reported user. Our team reviews them within a maximum of 48 business hours.`,
    },
    {
        title: '6. Appeals Process',
        content: `If you believe a moderation decision was incorrect, you have the right to appeal it:\n\n1. Write to contacto@sanemos.ai indicating: your display name, the content or action affected, and your reasons for the appeal.\n2. You will receive a response within 5 business days.\n3. Appeals are reviewed by a team member different from the one who made the original decision.\n4. If the appeal is valid, the sanction is revoked or reduced. If not, the reasons are explained.\n\nIn the future, we will enable an appeals form on the platform to make this process easier.`,
    },
    {
        title: '7. Transparency and Statistics',
        content: `We are committed to periodically publishing transparency reports that include:\n\n• Number of content items reviewed per period.\n• Number of sanctions applied by category.\n• Average resolution time for reports.\n• Significant changes to moderation policies.\n\nThese reports will be available on the platform once we reach the activity volume needed for the data to be meaningful.`,
    },
    {
        title: '8. Moderation Team Contact',
        content: `For any inquiries related to moderation:\n\nEmail: contacto@sanemos.ai\nResponse time: maximum 48 business hours\n\nIf the content involves an immediate risk to a person's life, please contact emergency services in your country first.`,
    },
];

export default function ModerationPolicyPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const isEs = locale === 'es';

    const sections = isEs ? SECTIONS_ES : SECTIONS_EN;

    return (
        <div className={styles.landing} style={{ minHeight: '80vh', paddingTop: '100px' }}>
            <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-md)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className={styles.heroTitle} style={{ fontSize: '2.5rem' }}>
                        {isEs ? '⚖️ Política de Moderación' : '⚖️ Moderation Policy'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {isEs
                            ? 'Transparencia sobre cómo protegemos a la comunidad de sanemos.ai'
                            : 'Transparency on how we protect the sanemos.ai community'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        {isEs ? 'Última actualización: 1 de marzo de 2026' : 'Last updated: March 1, 2026'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {sections.map((section, idx) => (
                        <div key={idx} style={{
                            background: 'var(--surface)',
                            padding: 'var(--space-lg)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                                {section.title}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.75', whiteSpace: 'pre-line' }}>
                                {section.content}
                            </p>
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
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
                        {isEs
                            ? '¿Tienes una queja o apelación sobre una decisión de moderación?'
                            : 'Do you have a complaint or appeal about a moderation decision?'}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push(`/${locale}/rules`)}
                        >
                            {isEs ? 'Ver Normas de la Comunidad' : 'View Community Guidelines'}
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push(`/${locale}/appeal`)}
                        >
                            {isEs ? 'Apelar una decisión' : 'Appeal a decision'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

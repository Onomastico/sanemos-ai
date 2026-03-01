'use client';

import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

const SECTIONS_ES = [
    {
        title: '1. Responsable del Tratamiento',
        content: `sanemos.ai es una plataforma digital de apoyo emocional operada por un equipo independiente con sede en la República de Chile.\n\nContacto del responsable del tratamiento:\nCorreo electrónico: contacto@sanemos.ai\n\nPara consultas relacionadas con tus datos personales, puedes comunicarte directamente con nosotros mediante el formulario de derechos ARCO disponible en la plataforma o por correo electrónico.`,
    },
    {
        title: '2. Marco Legal',
        content: `El tratamiento de tus datos personales se rige por la Ley N° 19.628 sobre Protección de la Vida Privada de la República de Chile, así como por cualquier normativa complementaria aplicable.\n\nAl registrarte en sanemos.ai, otorgas tu consentimiento libre, informado y específico para el tratamiento de tus datos personales según lo descrito en esta Política de Privacidad.`,
    },
    {
        title: '3. Datos que Recopilamos',
        content: `Recopilamos únicamente la información necesaria para prestar el servicio:\n\n• Datos de registro: nombre de pantalla, dirección de correo electrónico, contraseña (almacenada de forma cifrada).\n• Datos de perfil opcionales: tipo de pérdida vivida, cosmovisión o perspectiva espiritual.\n• Datos de uso: conversaciones con compañeros de IA, mensajes en la comunidad, cartas publicadas, entradas del diario personal, recursos visitados, terapeuta perfiles visualizados.\n• Datos técnicos: dirección IP, tipo de navegador, sistema operativo, marcas de tiempo de sesión.\n• Datos de moderación: registros de denuncias, sanciones aplicadas y razones de moderación.`,
    },
    {
        title: '4. Finalidades del Tratamiento',
        content: `Usamos tus datos exclusivamente para:\n\n• Prestar el servicio de apoyo emocional y gestionar tu cuenta.\n• Personalizar tu experiencia (p. ej., mostrar cartas o recursos relacionados con tu tipo de pérdida).\n• Moderar contenido para proteger la seguridad de la comunidad.\n• Mejorar el sistema mediante análisis agregados y anonimizados (nunca datos individuales identificables).\n• Enviarte comunicaciones de servicio (cambios de términos, alertas de seguridad). No enviamos publicidad comercial de terceros.\n• Cumplir obligaciones legales cuando así lo requiera la ley chilena.`,
    },
    {
        title: '5. Proveedores de Servicios (Sub-encargados)',
        content: `Para operar la plataforma, compartimos datos con los siguientes proveedores que actúan como sub-encargados del tratamiento. Todos ellos cuentan con políticas de privacidad y medidas de seguridad adecuadas:\n\n• Supabase, Inc. (Estados Unidos): almacenamiento de base de datos, autenticación y almacenamiento de archivos. Política de privacidad: supabase.com/privacy\n• Google LLC / Google DeepMind (Estados Unidos): procesamiento de lenguaje natural para los compañeros de IA mediante la API de Gemini. Política de privacidad: policies.google.com/privacy\n• OpenAI, L.P. (Estados Unidos): procesamiento alternativo de lenguaje natural. Política de privacidad: openai.com/privacy\n• Vercel, Inc. (Estados Unidos): alojamiento de la aplicación web.\n\nNo vendemos ni cedemos tus datos personales a terceros con fines comerciales o publicitarios.`,
    },
    {
        title: '6. Transferencias Internacionales de Datos',
        content: `Los proveedores mencionados están ubicados fuera de Chile (principalmente en Estados Unidos). Al aceptar esta Política de Privacidad, reconoces y consientes que tus datos personales pueden ser transferidos y procesados en países con marcos legales de protección de datos distintos al chileno.\n\nEn todos los casos exigimos a nuestros proveedores que apliquen medidas de seguridad técnicas y organizativas equivalentes a las requeridas por la legislación chilena, incluyendo cifrado en tránsito y en reposo, control de acceso y obligaciones de confidencialidad.`,
    },
    {
        title: '7. Retención de Datos',
        content: `Conservamos tus datos mientras tu cuenta esté activa. Los plazos específicos son:\n\n• Datos de cuenta y perfil: durante la vigencia de la cuenta; eliminados dentro de los 30 días siguientes a la cancelación.\n• Conversaciones con IA y diario personal: durante la vigencia de la cuenta; eliminados al cancelar.\n• Contenido de la comunidad (cartas, comentarios): puede conservarse de forma anonimizada tras la cancelación de la cuenta para mantener la coherencia de los hilos comunitarios, salvo solicitud expresa de eliminación.\n• Registros de moderación: 24 meses para efectos de seguridad y auditoría.\n• Datos técnicos (logs): 90 días.\n\nPuedes solicitar la eliminación de tu cuenta en cualquier momento desde la configuración de tu perfil o ejerciendo tu derecho de cancelación mediante el formulario ARCO.`,
    },
    {
        title: '8. Derechos ARCO',
        content: `De conformidad con la Ley N° 19.628, tienes los siguientes derechos sobre tus datos personales:\n\n• Acceso: saber qué datos tenemos sobre ti y cómo los usamos.\n• Rectificación: corregir datos inexactos o incompletos.\n• Cancelación: solicitar la eliminación de tus datos cuando ya no sean necesarios para la finalidad para la que fueron recopilados.\n• Oposición: oponerte al tratamiento de tus datos para finalidades específicas.\n\nPara ejercer cualquiera de estos derechos, utiliza el formulario ARCO disponible en sanemos.ai/[locale]/arco o escríbenos a contacto@sanemos.ai. Responderemos en un plazo máximo de 15 días hábiles.`,
    },
    {
        title: '9. Seguridad',
        content: `Aplicamos medidas de seguridad técnicas y organizativas para proteger tus datos personales, incluyendo:\n\n• Cifrado SSL/TLS en tránsito.\n• Cifrado de contraseñas mediante bcrypt (gestionado por Supabase Auth).\n• Control de acceso basado en roles (Row Level Security en base de datos).\n• Acceso restringido a datos sensibles únicamente al personal autorizado.\n\nSin embargo, ningún sistema de transmisión o almacenamiento en internet es completamente seguro. En caso de brecha de seguridad que afecte tus datos, te notificaremos según lo exige la legislación aplicable.`,
    },
    {
        title: '10. Menores de Edad',
        content: `sanemos.ai está dirigido a personas de 16 años o más. No recopilamos deliberadamente datos de menores de 16 años. Si un representante legal tiene conocimiento de que un menor de 16 años ha proporcionado datos personales sin autorización, puede solicitar su eliminación escribiendo a contacto@sanemos.ai.\n\nLos usuarios de entre 16 y 18 años declaran contar con el conocimiento de su representante legal al registrarse.`,
    },
    {
        title: '11. Cookies y Tecnologías Similares',
        content: `Usamos únicamente cookies técnicas estrictamente necesarias para el funcionamiento del servicio (gestión de sesión, autenticación). No usamos cookies de rastreo publicitario ni compartimos datos de navegación con redes publicitarias.\n\nPuedes configurar tu navegador para rechazar cookies, pero esto puede afectar el funcionamiento de la plataforma.`,
    },
    {
        title: '12. Cambios a esta Política',
        content: `Podemos actualizar esta Política de Privacidad periódicamente. Cuando lo hagamos, publicaremos la nueva versión en la plataforma y te notificaremos con al menos 15 días de anticipación si los cambios son significativos.\n\nEl uso continuado de sanemos.ai tras la entrada en vigor de la nueva versión implica la aceptación de los cambios.`,
    },
    {
        title: '13. Contacto',
        content: `Para consultas sobre privacidad, ejercicio de derechos ARCO o cualquier otra cuestión relacionada con el tratamiento de tus datos personales:\n\nCorreo: contacto@sanemos.ai\nFormulario ARCO: disponible en la plataforma\n\nNos comprometemos a responder en un plazo de 15 días hábiles.`,
    },
];

const SECTIONS_EN = [
    {
        title: '1. Data Controller',
        content: `sanemos.ai is a digital emotional support platform operated by an independent team based in the Republic of Chile.\n\nData Controller contact:\nEmail: contacto@sanemos.ai\n\nFor inquiries related to your personal data, you can contact us directly through the ARCO rights form available on the platform or by email.`,
    },
    {
        title: '2. Legal Framework',
        content: `The processing of your personal data is governed by Law No. 19,628 on the Protection of Private Life of the Republic of Chile, as well as any applicable complementary regulations.\n\nBy registering on sanemos.ai, you grant your free, informed, and specific consent for the processing of your personal data as described in this Privacy Policy.`,
    },
    {
        title: '3. Data We Collect',
        content: `We collect only the information necessary to provide the service:\n\n• Registration data: display name, email address, password (stored in encrypted form).\n• Optional profile data: type of loss experienced, worldview or spiritual perspective.\n• Usage data: conversations with AI companions, community messages, published letters, personal journal entries, resources viewed, therapist profiles viewed.\n• Technical data: IP address, browser type, operating system, session timestamps.\n• Moderation data: records of reports, sanctions applied, and moderation reasons.`,
    },
    {
        title: '4. Purposes of Processing',
        content: `We use your data exclusively to:\n\n• Provide the emotional support service and manage your account.\n• Personalize your experience (e.g., showing letters or resources related to your type of loss).\n• Moderate content to protect community safety.\n• Improve the system through aggregated and anonymized analysis (never individually identifiable data).\n• Send you service communications (term changes, security alerts). We do not send third-party commercial advertising.\n• Comply with legal obligations as required by Chilean law.`,
    },
    {
        title: '5. Service Providers (Sub-processors)',
        content: `To operate the platform, we share data with the following providers acting as data sub-processors. All of them have appropriate privacy policies and security measures in place:\n\n• Supabase, Inc. (United States): database storage, authentication, and file storage. Privacy policy: supabase.com/privacy\n• Google LLC / Google DeepMind (United States): natural language processing for AI companions via the Gemini API. Privacy policy: policies.google.com/privacy\n• OpenAI, L.P. (United States): alternative natural language processing. Privacy policy: openai.com/privacy\n• Vercel, Inc. (United States): web application hosting.\n\nWe do not sell or transfer your personal data to third parties for commercial or advertising purposes.`,
    },
    {
        title: '6. International Data Transfers',
        content: `The providers mentioned above are located outside Chile (primarily in the United States). By accepting this Privacy Policy, you acknowledge and consent that your personal data may be transferred to and processed in countries with different data protection legal frameworks than Chile.\n\nIn all cases, we require our providers to apply technical and organizational security measures equivalent to those required by Chilean law, including encryption in transit and at rest, access control, and confidentiality obligations.`,
    },
    {
        title: '7. Data Retention',
        content: `We retain your data while your account is active. Specific periods are:\n\n• Account and profile data: for the duration of the account; deleted within 30 days of cancellation.\n• AI conversations and personal journal: for the duration of the account; deleted upon cancellation.\n• Community content (letters, comments): may be retained in anonymized form after account cancellation to maintain community thread coherence, unless an explicit deletion request is made.\n• Moderation records: 24 months for security and audit purposes.\n• Technical data (logs): 90 days.\n\nYou may request deletion of your account at any time from your profile settings or by exercising your right of cancellation via the ARCO form.`,
    },
    {
        title: '8. ARCO Rights',
        content: `In accordance with Law No. 19,628, you have the following rights over your personal data:\n\n• Access: find out what data we hold about you and how we use it.\n• Rectification: correct inaccurate or incomplete data.\n• Cancellation: request deletion of your data when it is no longer necessary for the purpose for which it was collected.\n• Opposition: object to the processing of your data for specific purposes.\n\nTo exercise any of these rights, use the ARCO form available at sanemos.ai or write to contacto@sanemos.ai. We will respond within a maximum of 15 business days.`,
    },
    {
        title: '9. Security',
        content: `We apply technical and organizational security measures to protect your personal data, including:\n\n• SSL/TLS encryption in transit.\n• Password encryption via bcrypt (managed by Supabase Auth).\n• Role-based access control (Row Level Security in the database).\n• Restricted access to sensitive data only to authorized personnel.\n\nHowever, no internet transmission or storage system is completely secure. In the event of a security breach affecting your data, we will notify you as required by applicable law.`,
    },
    {
        title: '10. Minors',
        content: `sanemos.ai is intended for people aged 16 and over. We do not knowingly collect data from children under 16. If a legal guardian is aware that a child under 16 has provided personal data without authorization, they may request its deletion by writing to contacto@sanemos.ai.\n\nUsers between 16 and 18 years old declare that their legal guardian is aware of their registration.`,
    },
    {
        title: '11. Cookies and Similar Technologies',
        content: `We use only strictly necessary technical cookies for service operation (session management, authentication). We do not use advertising tracking cookies or share browsing data with advertising networks.\n\nYou may configure your browser to reject cookies, but this may affect platform functionality.`,
    },
    {
        title: '12. Changes to this Policy',
        content: `We may update this Privacy Policy periodically. When we do, we will publish the new version on the platform and notify you at least 15 days in advance if the changes are significant.\n\nContinued use of sanemos.ai after the new version takes effect constitutes acceptance of the changes.`,
    },
    {
        title: '13. Contact',
        content: `For privacy inquiries, exercise of ARCO rights, or any other matter related to the processing of your personal data:\n\nEmail: contacto@sanemos.ai\nARCO Form: available on the platform\n\nWe are committed to responding within 15 business days.`,
    },
];

export default function PrivacyPage() {
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
                        {isEs ? '🔒 Política de Privacidad' : '🔒 Privacy Policy'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {isEs
                            ? 'Cómo recopilamos, usamos y protegemos tus datos personales.'
                            : 'How we collect, use, and protect your personal data.'}
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
                            ? '¿Tienes preguntas sobre tus datos o quieres ejercer tus derechos ARCO?'
                            : 'Have questions about your data or want to exercise your ARCO rights?'}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push(`/${locale}/arco`)}
                        >
                            {isEs ? 'Formulario ARCO' : 'ARCO Rights Form'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push(`/${locale}/terms`)}
                        >
                            {isEs ? 'Términos y Condiciones' : 'Terms and Conditions'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

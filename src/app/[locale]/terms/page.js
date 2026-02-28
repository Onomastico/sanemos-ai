'use client';

import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/[locale]/page.module.css';

const SECTIONS_ES = [
    {
        title: '1. Aceptación de los Términos',
        content: `Al registrarte y usar sanemos.ai, confirmas que has leído, comprendido y aceptas estos Términos y Condiciones de Uso ("Términos"), así como nuestra Política de Privacidad y las Normas de la Comunidad. Si no estás de acuerdo con alguna de estas condiciones, no debes usar este servicio.`,
    },
    {
        title: '2. Descripción del Servicio',
        content: `sanemos.ai es una plataforma digital de apoyo emocional que ofrece:\n• Compañeros de inteligencia artificial para conversación y apoyo emocional.\n• Una comunidad en línea para el intercambio de experiencias entre pares.\n• Un directorio de terapeutas y profesionales de salud mental.\n• Recursos educativos sobre salud mental y bienestar.\n\nsanemos.ai no es un servicio médico, psicológico ni de emergencias. No reemplaza la atención profesional de salud mental.`,
    },
    {
        title: '3. Elegibilidad',
        content: `Para usar sanemos.ai debes:\n• Tener al menos 16 años de edad.\n• Si tienes entre 16 y 18 años, declaras contar con el conocimiento de tu representante legal y, donde la legislación aplicable lo requiera, su consentimiento.\n• Proporcionar información verdadera y actualizada al registrarte.\n• No haber sido suspendido/a o eliminado/a previamente de la plataforma.\n\nAl aceptar estos Términos, declaras que cumples con todos los requisitos anteriores.`,
    },
    {
        title: '4. Cuenta de Usuario',
        content: `Eres responsable de:\n• Mantener la confidencialidad de tu contraseña.\n• Todas las actividades realizadas bajo tu cuenta.\n• Notificarnos de inmediato ante cualquier acceso no autorizado a tu cuenta.\n\nNo puedes crear cuentas múltiples para evadir suspensiones o sanciones. sanemos.ai se reserva el derecho de verificar la identidad del usuario en caso de duda razonable.`,
    },
    {
        title: '5. Contenido del Usuario',
        content: `Al publicar contenido en sanemos.ai (mensajes, comentarios, reseñas), otorgas a sanemos.ai una licencia no exclusiva, gratuita y mundial para mostrar dicho contenido dentro de la plataforma con el fin de prestar el servicio. Conservas tus derechos de autor sobre el contenido que publicas.\n\nTe comprometes a no publicar contenido que:\n• Viole derechos de terceros o sea ilegal.\n• Sea amenazante, difamatorio, obsceno o que incite al odio.\n• Promueva la autolesión, el suicidio o actividades peligrosas.\n• Contenga publicidad, spam o código malicioso.`,
    },
    {
        title: '6. Los Compañeros de Inteligencia Artificial',
        content: `Los compañeros de IA de sanemos.ai (Luna, Marco, Serena, Alma y Faro) son herramientas de apoyo emocional generadas por modelos de lenguaje. Es fundamental comprender que:\n• No son profesionales de salud mental.\n• Sus respuestas son generadas automáticamente y pueden contener errores o imprecisiones.\n• No deben utilizarse como fuente de diagnóstico médico, psicológico o psiquiátrico.\n• En situaciones de emergencia o crisis, debes contactar a los servicios de emergencia correspondientes, no a los compañeros de IA.\n\nsanemos.ai no garantiza la precisión, completitud ni idoneidad de las respuestas generadas por los compañeros de IA.`,
    },
    {
        title: '7. Terapeutas y Profesionales',
        content: `sanemos.ai ofrece un directorio de terapeutas y profesionales de salud mental. Al respecto:\n• sanemos.ai no verifica ni certifica las credenciales de los profesionales listados en el directorio.\n• sanemos.ai no avala sus servicios, metodologías ni resultados terapéuticos.\n• sanemos.ai no es parte de la relación terapéutica entre el profesional y el usuario.\n• El uso de los servicios de cualquier terapeuta o profesional listado es decisión y responsabilidad exclusiva del usuario.\n\nLos terapeutas que deseen aparecer en el directorio deben proporcionar información veraz y son responsables de mantenerla actualizada.`,
    },
    {
        title: '8. Privacidad y Protección de Datos Personales',
        content: `El tratamiento de tus datos personales se rige por la Ley N° 19.628 sobre Protección de la Vida Privada de la República de Chile.\n\nRecopilamos y usamos únicamente la información necesaria para prestar el servicio:\n• Datos de registro: nombre de usuario, dirección de correo electrónico.\n• Datos de uso: conversaciones con compañeros de IA, participación en la comunidad, recursos visitados.\n• Datos técnicos: dirección IP, tipo de navegador, timestamps de sesión.\n\nNo vendemos tus datos personales a terceros. Los datos de conversación con IA se almacenan para brindarte continuidad en el servicio y pueden utilizarse de forma agregada y anonimizada para mejorar el sistema.\n\nPuedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a: contacto@sanemos.ai`,
    },
    {
        title: '9. Emergencias y Líneas de Crisis',
        content: `sanemos.ai no es un servicio de emergencias. Si tú o alguien más está en peligro inmediato, contacta de forma urgente:\n\n• SAMU (Chile): 131\n• Carabineros de Chile: 133\n• Línea de Salud Mental MINSAL (Chile): 600 360 7777\n• Fono Infancia (menores de edad): 147\n\nPara usuarios fuera de Chile, contacta los servicios de emergencia de tu país. Los compañeros de IA y el equipo de la plataforma no pueden sustituir la respuesta de emergencias profesionales.`,
    },
    {
        title: '10. Limitación de Responsabilidad',
        content: `En la máxima medida permitida por la legislación chilena aplicable, sanemos.ai no será responsable por:\n• Daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de usar el servicio.\n• El contenido publicado por otros usuarios de la plataforma.\n• La calidad, idoneidad o resultados de los terapeutas listados en el directorio.\n• Decisiones tomadas por los usuarios basadas en respuestas de los compañeros de IA.\n• Interrupciones del servicio por causas técnicas, mantenimiento o fuerza mayor.`,
    },
    {
        title: '11. Suspensión y Cancelación',
        content: `sanemos.ai puede suspender o eliminar tu cuenta si:\n• Incumples estos Términos o las Normas de la Comunidad.\n• Utilizas el servicio de forma fraudulenta, abusiva o ilegal.\n• Tu comportamiento representa un riesgo para la seguridad o el bienestar de otros usuarios.\n\nPuedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil. La cancelación no afecta a las obligaciones contraídas con anterioridad.`,
    },
    {
        title: '12. Modificaciones de los Términos',
        content: `sanemos.ai puede modificar estos Términos en cualquier momento. Cuando lo hagamos, publicaremos la nueva versión en la plataforma y te notificaremos con al menos 15 días de anticipación mediante el correo electrónico registrado o un aviso visible en la plataforma.\n\nEl uso continuado del servicio una vez entrada en vigor la nueva versión implica la aceptación de los cambios. Si no aceptas los nuevos Términos, debes cancelar tu cuenta antes de la fecha de vigencia.`,
    },
    {
        title: '13. Legislación Aplicable y Resolución de Disputas',
        content: `Estos Términos se rigen e interpretan de conformidad con la legislación vigente en la República de Chile. Cualquier controversia derivada del uso de sanemos.ai será sometida a la jurisdicción de los tribunales ordinarios de justicia de la ciudad de Santiago de Chile, salvo que la ley establezca una jurisdicción diferente en beneficio del consumidor.`,
    },
    {
        title: '14. Contacto',
        content: `Para consultas, reclamos o ejercicio de derechos sobre estos Términos o la Política de Privacidad, escríbenos a:\n\ncorreo: contacto@sanemos.ai\n\nNos comprometemos a responder en un plazo de 15 días hábiles.`,
    },
];

const SECTIONS_EN = [
    {
        title: '1. Acceptance of Terms',
        content: `By registering and using sanemos.ai, you confirm that you have read, understood, and agree to these Terms and Conditions of Use ("Terms"), as well as our Privacy Policy and Community Guidelines. If you disagree with any of these conditions, you must not use this service.`,
    },
    {
        title: '2. Description of Service',
        content: `sanemos.ai is a digital emotional support platform that offers:\n• Artificial intelligence companions for conversation and emotional support.\n• An online community for peer experience sharing.\n• A directory of therapists and mental health professionals.\n• Educational resources on mental health and well-being.\n\nsanemos.ai is not a medical, psychological, or emergency service. It does not replace professional mental health care.`,
    },
    {
        title: '3. Eligibility',
        content: `To use sanemos.ai you must:\n• Be at least 16 years of age.\n• If you are between 16 and 18 years old, you declare that your legal guardian is aware of your use and, where required by applicable law, has given consent.\n• Provide accurate and up-to-date information when registering.\n• Not have been previously suspended or removed from the platform.\n\nBy accepting these Terms, you declare that you meet all of the above requirements.`,
    },
    {
        title: '4. User Account',
        content: `You are responsible for:\n• Maintaining the confidentiality of your password.\n• All activities carried out under your account.\n• Notifying us immediately of any unauthorized access to your account.\n\nYou may not create multiple accounts to evade suspensions or penalties. sanemos.ai reserves the right to verify user identity when there is reasonable cause.`,
    },
    {
        title: '5. User Content',
        content: `By posting content on sanemos.ai (messages, comments, reviews), you grant sanemos.ai a non-exclusive, royalty-free, worldwide license to display such content within the platform for the purpose of providing the service. You retain copyright ownership of the content you post.\n\nYou agree not to post content that:\n• Violates third-party rights or is illegal.\n• Is threatening, defamatory, obscene, or incites hatred.\n• Promotes self-harm, suicide, or dangerous activities.\n• Contains advertising, spam, or malicious code.`,
    },
    {
        title: '6. Artificial Intelligence Companions',
        content: `sanemos.ai's AI companions (Luna, Marco, Serena, Alma, and Faro) are emotional support tools generated by language models. It is essential to understand that:\n• They are not mental health professionals.\n• Their responses are automatically generated and may contain errors or inaccuracies.\n• They must not be used as a source of medical, psychological, or psychiatric diagnosis.\n• In emergency or crisis situations, you must contact the appropriate emergency services, not the AI companions.\n\nsanemos.ai does not guarantee the accuracy, completeness, or suitability of responses generated by the AI companions.`,
    },
    {
        title: '7. Therapists and Professionals',
        content: `sanemos.ai offers a directory of therapists and mental health professionals. Please note:\n• sanemos.ai does not verify or certify the credentials of professionals listed in the directory.\n• sanemos.ai does not endorse their services, methodologies, or therapeutic outcomes.\n• sanemos.ai is not party to the therapeutic relationship between the professional and the user.\n• The use of services from any listed therapist or professional is the user's sole decision and responsibility.\n\nTherapists who wish to appear in the directory must provide accurate information and are responsible for keeping it up to date.`,
    },
    {
        title: '8. Privacy and Personal Data Protection',
        content: `The processing of your personal data is governed by Law No. 19,628 on the Protection of Private Life of the Republic of Chile.\n\nWe collect and use only the information necessary to provide the service:\n• Registration data: username, email address.\n• Usage data: conversations with AI companions, community participation, resources viewed.\n• Technical data: IP address, browser type, session timestamps.\n\nWe do not sell your personal data to third parties. Conversation data with AI is stored to provide continuity of service and may be used in aggregated and anonymized form to improve the system.\n\nYou may exercise your rights of access, rectification, cancellation, and objection by writing to: contacto@sanemos.ai`,
    },
    {
        title: '9. Emergencies and Crisis Lines',
        content: `sanemos.ai is not an emergency service. If you or someone else is in immediate danger, urgently contact:\n\n• SAMU (Chile): 131\n• Carabineros de Chile: 133\n• MINSAL Mental Health Line (Chile): 600 360 7777\n• Fono Infancia (minors): 147\n\nFor users outside Chile, contact the emergency services in your country. AI companions and the platform team cannot substitute for professional emergency responders.`,
    },
    {
        title: '10. Limitation of Liability',
        content: `To the maximum extent permitted by applicable Chilean law, sanemos.ai shall not be liable for:\n• Direct, indirect, incidental, or consequential damages arising from the use or inability to use the service.\n• Content posted by other users of the platform.\n• The quality, suitability, or results of therapists listed in the directory.\n• Decisions made by users based on AI companion responses.\n• Service interruptions due to technical causes, maintenance, or force majeure.`,
    },
    {
        title: '11. Suspension and Cancellation',
        content: `sanemos.ai may suspend or delete your account if:\n• You violate these Terms or the Community Guidelines.\n• You use the service in a fraudulent, abusive, or illegal manner.\n• Your conduct poses a risk to the safety or well-being of other users.\n\nYou may cancel your account at any time from your profile settings. Cancellation does not affect obligations incurred prior to that date.`,
    },
    {
        title: '12. Modifications to the Terms',
        content: `sanemos.ai may modify these Terms at any time. When we do, we will publish the new version on the platform and notify you at least 15 days in advance via your registered email address or a prominent notice on the platform.\n\nContinued use of the service after the new version takes effect constitutes acceptance of the changes. If you do not accept the new Terms, you must cancel your account before the effective date.`,
    },
    {
        title: '13. Governing Law and Dispute Resolution',
        content: `These Terms are governed by and interpreted in accordance with the laws in force in the Republic of Chile. Any dispute arising from the use of sanemos.ai shall be subject to the jurisdiction of the ordinary courts of justice in the city of Santiago, Chile, unless the law establishes a different jurisdiction for the benefit of the consumer.`,
    },
    {
        title: '14. Contact',
        content: `For inquiries, complaints, or the exercise of rights under these Terms or the Privacy Policy, write to us at:\n\nEmail: contacto@sanemos.ai\n\nWe are committed to responding within 15 business days.`,
    },
];

export default function TermsPage() {
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
                        {isEs ? 'Términos y Condiciones' : 'Terms and Conditions'}
                    </h1>
                    <p className={styles.heroSubtitle} style={{ marginTop: 'var(--space-md)' }}>
                        {isEs
                            ? 'Por favor, lee detenidamente estos términos antes de usar sanemos.ai.'
                            : 'Please read these terms carefully before using sanemos.ai.'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        {isEs ? 'Última actualización: 28 de febrero de 2026' : 'Last updated: February 28, 2026'}
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
                            ? 'Al crear una cuenta en sanemos.ai, confirmas que has leído y aceptas estos Términos y Condiciones y las Normas de la Comunidad.'
                            : 'By creating an account on sanemos.ai, you confirm that you have read and agree to these Terms and Conditions and the Community Guidelines.'}
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
                            onClick={() => router.push(`/${locale}/auth/register`)}
                        >
                            {isEs ? 'Crear cuenta' : 'Create account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

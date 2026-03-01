import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'noreply@sanemos.ai';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatShiftTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago',
    });
}

function formatShiftHour(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago',
    });
}

// ─────────────────────────────────────────────
// Email senders
// ─────────────────────────────────────────────

/**
 * Sent to applicant immediately after submitting a volunteer application.
 */
export async function sendVolunteerApplicationReceived({ name, email }) {
    return resend.emails.send({
        from: `sanemos.ai <${FROM}>`,
        to: email,
        subject: 'Recibimos tu solicitud para ser voluntario/a — sanemos.ai',
        html: volunteerApplicationHtml({ name }),
    });
}

/**
 * Sent to volunteer when admin approves their application.
 * If they don't have an account yet, includes a registration link.
 */
export async function sendVolunteerApproved({ name, email, hasAccount, locale = 'es' }) {
    const registerUrl = `${SITE_URL}/${locale}/auth/register`;
    return resend.emails.send({
        from: `sanemos.ai <${FROM}>`,
        to: email,
        subject: '¡Tu solicitud de voluntario/a fue aprobada! — sanemos.ai',
        html: volunteerApprovedHtml({ name, hasAccount, registerUrl }),
    });
}

/**
 * Sent to volunteer when admin assigns them a shift.
 * Includes Confirm / Decline buttons with tokenized links.
 */
export async function sendVolunteerShift({ name, email, shift, token }) {
    const confirmUrl = `${SITE_URL}/api/volunteers/shifts/${token}/confirm`;
    const declineUrl = `${SITE_URL}/api/volunteers/shifts/${token}/decline`;
    const startLabel = formatShiftTime(shift.start_time);
    const endHour = formatShiftHour(shift.end_time);

    return resend.emails.send({
        from: `sanemos.ai <${FROM}>`,
        to: email,
        subject: `Turno asignado: ${startLabel} — sanemos.ai`,
        html: volunteerShiftHtml({ name, startLabel, endHour, notes: shift.notes, confirmUrl, declineUrl }),
    });
}

// ─────────────────────────────────────────────
// HTML Templates
// ─────────────────────────────────────────────

function emailWrapper(content) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#e8f1f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f1f8;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:#0b1d3a;border-radius:16px 16px 0 0;padding:32px 48px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#e8f4ff;letter-spacing:-0.5px;">
                sanemos<span style="color:#3395ff;">.ai</span>
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#7bacd0;letter-spacing:0.04em;">
                No estás solo/a en tu duelo
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:44px 48px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f8fb;border-radius:0 0 16px 16px;padding:20px 48px;border-top:1px solid #d6e8f5;">
              <p style="margin:0;font-size:11px;color:#7bacd0;line-height:1.7;">
                © ${new Date().getFullYear()} sanemos.ai ·
                <a href="mailto:contacto@sanemos.ai" style="color:#3395ff;text-decoration:none;">contacto@sanemos.ai</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function volunteerApplicationHtml({ name }) {
    return emailWrapper(`
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#e8f4ff,#c5dff7);border-radius:50%;font-size:28px;line-height:64px;display:inline-block;">🤝</div>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0b1d3a;text-align:center;">¡Gracias, ${name}!</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#3c7ca9;text-align:center;">Recibimos tu solicitud para ser voluntario/a</p>
      <hr style="border:none;border-top:1px solid #e8f1f8;margin:0 0 24px;" />
      <p style="margin:0 0 14px;font-size:15px;color:#2f4d64;line-height:1.75;">
        Tu solicitud ha sido recibida y está siendo revisada por nuestro equipo. Te contactaremos pronto con una respuesta.
      </p>
      <p style="margin:0;font-size:15px;color:#2f4d64;line-height:1.75;">
        Agradecemos profundamente tu disposición a acompañar a personas en momentos difíciles. Ese gesto importa mucho.
      </p>
    `);
}

function volunteerApprovedHtml({ name, hasAccount, registerUrl }) {
    const accountSection = hasAccount
        ? `<p style="margin:0 0 14px;font-size:15px;color:#2f4d64;line-height:1.75;">Puedes iniciar sesión en sanemos.ai y estarás listo/a para recibir tus turnos cuando el equipo los programe.</p>`
        : `<p style="margin:0 0 14px;font-size:15px;color:#2f4d64;line-height:1.75;">Para completar tu incorporación necesitas crear una cuenta en sanemos.ai. Esto nos permite coordinarte los turnos directamente desde la plataforma.</p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
             <tr><td align="center">
               <a href="${registerUrl}" style="display:inline-block;background:#3395ff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;">
                 Crear mi cuenta
               </a>
             </td></tr>
           </table>`;

    return emailWrapper(`
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#e8f4ff,#c5dff7);border-radius:50%;font-size:28px;line-height:64px;display:inline-block;">✅</div>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0b1d3a;text-align:center;">¡Bienvenido/a al equipo, ${name}!</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#3c7ca9;text-align:center;">Tu solicitud de voluntario/a fue aprobada</p>
      <hr style="border:none;border-top:1px solid #e8f1f8;margin:0 0 24px;" />
      <p style="margin:0 0 14px;font-size:15px;color:#2f4d64;line-height:1.75;">
        Estamos muy contentos/as de tenerte como parte de nuestra comunidad de voluntarios/as. Tu presencia marcará una diferencia real para las personas que buscan apoyo.
      </p>
      ${accountSection}
      <p style="margin:0;font-size:14px;color:#4a7aa8;line-height:1.7;">
        Pronto recibirás un correo con los detalles de tu primer turno. Gracias por ser parte de sanemos.ai.
      </p>
    `);
}

function volunteerShiftHtml({ name, startLabel, endHour, notes, confirmUrl, declineUrl }) {
    return emailWrapper(`
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#e8f4ff,#c5dff7);border-radius:50%;font-size:28px;line-height:64px;display:inline-block;">📅</div>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0b1d3a;text-align:center;">Turno asignado</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#3c7ca9;text-align:center;">Hola ${name}, tienes un nuevo turno programado</p>
      <hr style="border:none;border-top:1px solid #e8f1f8;margin:0 0 24px;" />

      <!-- Shift details box -->
      <div style="background:#f4f8fb;border:1px solid #d6e8f5;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#3c7ca9;">Horario del turno</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#0b1d3a;text-transform:capitalize;">${startLabel}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#4a7aa8;">Hasta las ${endHour} (hora de Santiago)</p>
        ${notes ? `<p style="margin:12px 0 0;font-size:13px;color:#4a7aa8;border-top:1px solid #d6e8f5;padding-top:12px;">${notes}</p>` : ''}
      </div>

      <p style="margin:0 0 24px;font-size:15px;color:#2f4d64;line-height:1.75;">
        Por favor confirma si podrás estar disponible en este horario o indícanos si no puedes:
      </p>

      <!-- CTA Buttons -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center" style="padding:0 8px 0 0;">
            <a href="${confirmUrl}" style="display:inline-block;background:#3395ff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
              ✓ Confirmar turno
            </a>
          </td>
          <td align="center" style="padding:0 0 0 8px;">
            <a href="${declineUrl}" style="display:inline-block;background:#f4f8fb;color:#4a7aa8;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;border:1px solid #d6e8f5;">
              ✗ No puedo
            </a>
          </td>
        </tr>
      </table>

      <div style="background:#f4f8fb;border:1px solid #d6e8f5;border-radius:8px;padding:14px 18px;">
        <p style="margin:0;font-size:12px;color:#4a7aa8;line-height:1.6;">
          Al confirmar, recuerda ingresar a sanemos.ai en el horario del turno y hacer clic en <strong>"Iniciar turno"</strong> desde tu panel de usuario para registrar tu asistencia.
        </p>
      </div>
    `);
}

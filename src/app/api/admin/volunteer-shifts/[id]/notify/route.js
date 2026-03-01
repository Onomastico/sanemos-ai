import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVolunteerShift } from '@/lib/email';

export async function POST(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = createAdminClient();

    const { data: shift, error } = await admin
        .from('volunteer_shifts')
        .select(`
            *,
            volunteer_applications(id, name, email)
        `)
        .eq('id', id)
        .single();

    if (error || !shift) {
        return NextResponse.json({ error: 'Turno no encontrado.' }, { status: 404 });
    }

    const volunteer = shift.volunteer_applications;
    if (!volunteer?.email) {
        return NextResponse.json({ error: 'El voluntario no tiene email registrado.' }, { status: 400 });
    }

    try {
        await sendVolunteerShift({
            name: volunteer.name,
            email: volunteer.email,
            shift: {
                start_time: shift.start_time,
                end_time: shift.end_time,
                notes: shift.notes,
            },
            token: shift.confirmation_token,
        });

        // Mark as notified
        const { data: updated } = await admin
            .from('volunteer_shifts')
            .update({ notified_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        return NextResponse.json({ success: true, shift: updated });
    } catch (err) {
        console.error('Error sending shift notification:', err);
        return NextResponse.json({ error: 'Error al enviar el correo.' }, { status: 500 });
    }
}

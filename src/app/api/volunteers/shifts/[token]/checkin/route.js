import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request, { params }) {
    try {
        const { token } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

        const admin = createAdminClient();

        // Find the shift by token
        const { data: shift, error: shiftError } = await admin
            .from('volunteer_shifts')
            .select('id, volunteer_id, start_time, end_time, status')
            .eq('confirmation_token', token)
            .maybeSingle();

        if (shiftError || !shift) {
            return NextResponse.json({ error: 'Turno no encontrado.' }, { status: 404 });
        }

        // Verify this user owns this volunteer application
        const { data: application } = await admin
            .from('volunteer_applications')
            .select('id')
            .eq('id', shift.volunteer_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!application) {
            return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
        }

        // Check if already checked in
        const { data: existing } = await admin
            .from('volunteer_checkins')
            .select('id')
            .eq('shift_id', shift.id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'Ya hiciste check-in para este turno.' }, { status: 409 });
        }

        const { data: checkin, error: checkinError } = await admin
            .from('volunteer_checkins')
            .insert({
                shift_id: shift.id,
                volunteer_id: shift.volunteer_id,
                checked_in_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (checkinError) {
            console.error('Checkin error:', checkinError);
            return NextResponse.json({ error: 'Error al registrar el check-in.' }, { status: 500 });
        }

        return NextResponse.json({ checkin });
    } catch (err) {
        console.error('Checkin route error:', err);
        return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 });
    }
}

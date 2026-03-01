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

        const { data: shift } = await admin
            .from('volunteer_shifts')
            .select('id, volunteer_id')
            .eq('confirmation_token', token)
            .maybeSingle();

        if (!shift) {
            return NextResponse.json({ error: 'Turno no encontrado.' }, { status: 404 });
        }

        // Verify ownership
        const { data: application } = await admin
            .from('volunteer_applications')
            .select('id')
            .eq('id', shift.volunteer_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!application) {
            return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
        }

        const { data: checkin, error } = await admin
            .from('volunteer_checkins')
            .update({ checked_out_at: new Date().toISOString() })
            .eq('shift_id', shift.id)
            .is('checked_out_at', null)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'No se encontró check-in activo.' }, { status: 404 });
        }

        return NextResponse.json({ checkin });
    } catch (err) {
        console.error('Checkout route error:', err);
        return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 });
    }
}

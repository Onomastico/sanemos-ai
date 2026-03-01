import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

        const admin = createAdminClient();

        // Find the volunteer application for this user
        const { data: application } = await admin
            .from('volunteer_applications')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .maybeSingle();

        if (!application) {
            return NextResponse.json({ shifts: [] });
        }

        // Get upcoming and today's confirmed shifts with checkin info
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const { data: shifts } = await admin
            .from('volunteer_shifts')
            .select(`
                *,
                volunteer_checkins(id, checked_in_at, checked_out_at)
            `)
            .eq('volunteer_id', application.id)
            .in('status', ['confirmed', 'scheduled'])
            .gte('end_time', todayStart.toISOString())
            .order('start_time', { ascending: true })
            .limit(10);

        return NextResponse.json({ shifts: shifts || [] });
    } catch (err) {
        console.error('my-shifts error:', err);
        return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
    }
}

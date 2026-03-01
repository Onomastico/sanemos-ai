import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request, { params }) {
    const { token } = await params;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!token) {
        return NextResponse.redirect(`${SITE_URL}/es/volunteers/shift-declined?error=invalid`);
    }

    try {
        const admin = createAdminClient();
        const { data: shift, error } = await admin
            .from('volunteer_shifts')
            .select('id, status')
            .eq('confirmation_token', token)
            .maybeSingle();

        if (error || !shift) {
            return NextResponse.redirect(`${SITE_URL}/es/volunteers/shift-declined?error=not_found`);
        }

        if (['cancelled', 'completed'].includes(shift.status)) {
            return NextResponse.redirect(`${SITE_URL}/es/volunteers/shift-declined?error=expired`);
        }

        await admin
            .from('volunteer_shifts')
            .update({ status: 'declined' })
            .eq('id', shift.id);

        return NextResponse.redirect(`${SITE_URL}/es/volunteers/shift-declined`);
    } catch (err) {
        console.error('Shift decline error:', err);
        return NextResponse.redirect(`${SITE_URL}/es/volunteers/shift-declined?error=server`);
    }
}

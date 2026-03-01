import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVolunteerApproved } from '@/lib/email';

export async function GET(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending | approved | rejected | all

    const admin = createAdminClient();
    let query = admin
        .from('volunteer_applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data: volunteers, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ volunteers: volunteers || [] });
}

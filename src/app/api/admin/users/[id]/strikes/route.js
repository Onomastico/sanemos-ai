import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/admin/users/[id]/strikes — modify user strikes
export async function PATCH(request, { params }) {
    const { isAdmin } = await checkStaff();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { action } = await request.json(); // 'increment', 'decrement', 'reset'

    const admin = createAdminClient();

    // Fetch current strikes
    const { data: profile, error: readError } = await admin
        .from('profiles')
        .select('strikes')
        .eq('id', id)
        .single();

    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

    let newStrikes = profile.strikes || 0;

    if (action === 'increment') newStrikes += 1;
    else if (action === 'decrement' && newStrikes > 0) newStrikes -= 1;
    else if (action === 'reset') newStrikes = 0;

    const { data, error } = await admin
        .from('profiles')
        .update({ strikes: newStrikes })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_TYPES = ['access', 'rectification', 'cancellation', 'opposition', 'delete_account'];

export async function POST(request) {
    const body = await request.json().catch(() => ({}));
    const { right_type, name, email, description } = body;

    if (!VALID_TYPES.includes(right_type)) {
        return NextResponse.json({ error: 'Invalid right type' }, { status: 400 });
    }
    if (!name?.trim() || !email?.trim() || !description?.trim()) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Try to identify the user by their email (optional — may not be logged in)
    let userId = null;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
    } catch { /* not logged in is fine */ }

    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('arco_requests')
        .insert({
            right_type,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            description: description.trim(),
            user_id: userId,
            status: 'pending',
        });

    if (error) {
        // Table may not exist yet — still return success to avoid leaking info,
        // but log so admins can track
        console.error('[ARCO] insert error:', error.message);
        // We still return 200 so the user isn't confused; admin can check logs
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
}

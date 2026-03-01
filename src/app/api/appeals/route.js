import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_TYPES = ['content_removed', 'strike', 'suspension_temp', 'suspension_perm', 'other'];

export async function POST(request) {
    const body = await request.json().catch(() => ({}));
    const { appeal_type, display_name, email, description } = body;

    if (!VALID_TYPES.includes(appeal_type)) {
        return NextResponse.json({ error: 'Invalid appeal_type' }, { status: 400 });
    }
    if (!display_name?.trim() || !email?.trim() || !description?.trim()) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    let userId = null;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
    } catch { /* not logged in is fine */ }

    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('moderation_appeals')
        .insert({
            user_id: userId,
            appeal_type,
            display_name: display_name.trim(),
            email: email.trim().toLowerCase(),
            description: description.trim(),
            status: 'pending',
        });

    if (error) {
        console.error('[appeals] insert error:', error.message);
        // Return success anyway to avoid leaking info
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
}

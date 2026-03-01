import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function isStaff(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single();
    return profile && (['admin', 'moderator'].includes(profile.role) || profile.is_admin === true);
}

export async function PATCH(request, { params }) {
    const supabase = await createClient();
    if (!(await isStaff(supabase))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { status, rejection_reason } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData = { moderation_status: status };
    if (status === 'rejected') {
        updateData.moderation_rejection_reason = rejection_reason || null;
    }

    // Use admin client to bypass RLS — admin can update any letter's status
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from('letters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ letter: data });
}

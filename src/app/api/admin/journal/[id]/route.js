import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const { status, rejection_reason } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const updates = { moderation_status: status };

    if (status === 'rejected') {
        updates.is_public = false;
        updates.moderation_rejection_reason = rejection_reason || null;
    }

    const { data, error } = await admin
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entry: data });
}

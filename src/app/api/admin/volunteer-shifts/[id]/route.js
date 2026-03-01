import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { notes, status } = body;

    const updates = {};
    if (notes !== undefined) updates.notes = notes;
    if (status) updates.status = status;

    const admin = createAdminClient();
    const { data: shift, error } = await admin
        .from('volunteer_shifts')
        .update(updates)
        .eq('id', id)
        .select(`*, volunteer_applications(id, name, email)`)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ shift });
}

export async function DELETE(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin
        .from('volunteer_shifts')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

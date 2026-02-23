import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// PUT /api/admin/resources/[id] — update resource
export async function PUT(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('resources')
        .update({
            title: body.title,
            description: body.description || null,
            type: body.type,
            worldview: body.worldview || 'universal',
            external_url: body.external_url || null,
            cover_url: body.cover_url || null,
            author_or_creator: body.author_or_creator || null,
            focus_theme: body.focus_theme || null,
            availability: body.availability || null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resource: data });
}

// PATCH /api/admin/resources/[id] — approve or reject a resource
export async function PATCH(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    const updateData = { status: body.status };
    if (body.status === 'rejected' && body.rejection_reason) {
        updateData.rejection_reason = body.rejection_reason;
    }
    if (body.status === 'approved') {
        updateData.rejection_reason = null;
    }

    const { data, error } = await admin
        .from('resources')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resource: data });
}

// DELETE /api/admin/resources/[id]
export async function DELETE(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin.from('resources').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

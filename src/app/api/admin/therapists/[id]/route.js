import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// PUT /api/admin/therapists/[id]
export async function PUT(request, { params }) {
    const { isAdmin } = await checkStaff();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('therapists')
        .update({
            full_name: body.full_name,
            title: body.title || null,
            bio: body.bio || null,
            photo_url: body.photo_url || null,
            email: body.email || null,
            phone: body.phone || null,
            website: body.website || null,
            linkedin_url: body.linkedin_url || null,
            credentials_url: body.credentials_url || null,
            city: body.city || null,
            country: body.country || null,
            modality: body.modality || 'both',
            languages: body.languages || ['en'],
            specializations: body.specializations || [],
            license_number: body.license_number || null,
            is_verified: body.is_verified || false,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ therapist: data });
}

// DELETE /api/admin/therapists/[id]
export async function DELETE(request, { params }) {
    const { isAdmin } = await checkStaff();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin.from('therapists').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

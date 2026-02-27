import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/therapists — list all therapists (admin only)
export async function GET(request) {
    const { isAdmin } = await checkStaff();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const admin = createAdminClient();
    let query = admin
        .from('therapists')
        .select('*, profiles(id, display_name)')
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ therapists: data || [] });
}

// POST /api/admin/therapists — create therapist (admin only)
export async function POST(request) {
    const { isAdmin } = await checkStaff();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('therapists')
        .insert({
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
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ therapist: data });
}

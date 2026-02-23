import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/resources — list resources, optionally filter by status
export async function GET(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'

    const admin = createAdminClient();
    let query = admin
        .from('resources')
        .select('*, profiles!resources_created_by_fkey(display_name)')
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resources: data || [] });
}

// POST /api/admin/resources — create resource (as admin, auto-approved)
export async function POST(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('resources')
        .insert({
            title: body.title,
            description: body.description || null,
            type: body.type,
            worldview: body.worldview || 'universal',
            external_url: body.external_url || null,
            cover_url: body.cover_url || null,
            author_or_creator: body.author_or_creator || null,
            focus_theme: body.focus_theme || null,
            availability: body.availability || null,
            created_by: body.created_by || null,
            status: 'approved', // Admin-created resources are auto-approved
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resource: data });
}

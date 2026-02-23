import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/reviews — list reviews, optionally filter by status
export async function GET(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const admin = createAdminClient();
    let query = admin
        .from('resource_reviews')
        .select('*, profiles(display_name), resources(title)')
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data || [] });
}

// PATCH /api/admin/reviews — approve or reject a review
export async function PATCH(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
        .from('resource_reviews')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ review: data });
}

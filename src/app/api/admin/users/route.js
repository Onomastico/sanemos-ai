import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/users — list up to 50 users for the admin panel
export async function GET(request) {
    const { isAdmin } = await checkStaff();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');

    const admin = createAdminClient();
    let query = admin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (search) {
        query = query.ilike('display_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data || [] });
}

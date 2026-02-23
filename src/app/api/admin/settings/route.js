import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkStaff } from '@/lib/supabase/auth';

export async function GET(request) {
    const { isAdmin, user } = await checkStaff();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const admin = createAdminClient();

    const { data: settings } = await admin
        .from('system_settings')
        .select('*');

    return NextResponse.json({ settings: settings || [] });
}

export async function POST(request) {
    const { isAdmin, user } = await checkStaff();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const admin = createAdminClient();

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
        return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    // Convert value to valid jsonb safely.
    // In our case we are expecting 'gemini' or 'openai' so quoted string.
    const jsonValue = typeof value === 'string' ? `"${value}"` : value;

    const { error } = await admin
        .from('system_settings')
        .upsert({
            key,
            value: jsonValue
        }, { onConflict: 'key' });

    if (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

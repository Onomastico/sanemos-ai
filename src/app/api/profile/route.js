import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, loss_type, worldview, locale')
        .eq('id', user.id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile });
}

export async function PATCH(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Whitelist allowed fields
    const VALID_LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
    const VALID_WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];

    const updates = {};

    if ('display_name' in body) {
        const name = (body.display_name || '').trim();
        if (!name) return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 });
        if (name.length > 50) return NextResponse.json({ error: 'Display name too long' }, { status: 400 });
        updates.display_name = name;
    }

    if ('loss_type' in body) {
        if (body.loss_type && !VALID_LOSS_TYPES.includes(body.loss_type)) {
            return NextResponse.json({ error: 'Invalid loss_type' }, { status: 400 });
        }
        updates.loss_type = body.loss_type || null;
    }

    if ('worldview' in body) {
        if (body.worldview && !VALID_WORLDVIEWS.includes(body.worldview)) {
            return NextResponse.json({ error: 'Invalid worldview' }, { status: 400 });
        }
        updates.worldview = body.worldview || null;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('id, display_name, avatar_url, loss_type, worldview, locale')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile });
}

export async function DELETE() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client to delete the auth user — cascades to profiles and all user data
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}

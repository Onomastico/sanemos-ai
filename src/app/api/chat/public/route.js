import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get all public conversations
    const { data, error } = await admin
        .from('conversations')
        .select(`
            id, title, visibility, loss_type, worldview, type, updated_at
        `)
        .eq('visibility', 'public')
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Public conversations fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: data || [] });
}

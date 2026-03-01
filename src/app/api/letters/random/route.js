import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let lossType = null;
    let worldview = null;

    // If logged in, try to get profile preferences for personalization
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('loss_type, worldview')
            .eq('id', user.id)
            .single();
        lossType = profile?.loss_type || null;
        worldview = profile?.worldview || null;
    }

    // Try to find a matching letter (personalized)
    let letter = null;

    if (lossType || worldview) {
        let query = supabase
            .from('letters')
            .select('id, content, loss_type, worldview, created_at')
            .eq('moderation_status', 'approved');

        if (lossType) query = query.eq('loss_type', lossType);
        if (worldview) query = query.eq('worldview', worldview);

        const { data: matched } = await query;
        if (matched && matched.length > 0) {
            letter = matched[Math.floor(Math.random() * matched.length)];
        }
    }

    // Fallback: any approved letter (excluding user's own if logged in)
    if (!letter) {
        let query = supabase
            .from('letters')
            .select('id, content, loss_type, worldview, created_at')
            .eq('moderation_status', 'approved');

        if (user) query = query.neq('user_id', user.id);

        const { data: all } = await query;
        if (all && all.length > 0) {
            letter = all[Math.floor(Math.random() * all.length)];
        }
    }

    if (!letter) {
        return NextResponse.json({ letter: null });
    }

    // Get comment count
    const { data: comments } = await supabase
        .from('letter_comments')
        .select('id')
        .eq('letter_id', letter.id);

    return NextResponse.json({
        letter: {
            ...letter,
            comment_count: (comments || []).length,
        },
    });
}

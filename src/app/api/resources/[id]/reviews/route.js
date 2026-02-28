import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { moderateReview } from '@/lib/moderation';

export async function POST(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resourceId = params.id;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating (1-5) is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch resource title for context in the moderation prompt
    const { data: resourceData } = await admin
        .from('resources')
        .select('title')
        .eq('id', resourceId)
        .single();

    const resourceTitle = resourceData?.title || 'Unknown resource';

    // Insert review as pending
    const { data: review, error: insertError } = await admin
        .from('resource_reviews')
        .insert({
            resource_id: resourceId,
            user_id: user.id,
            rating,
            comment: comment || null,
            status: 'pending',
        })
        .select()
        .single();

    if (insertError) {
        // Unique constraint means user already reviewed this resource
        if (insertError.code === '23505') {
            return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
        }
        console.error('Review insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
    }

    // Run AI moderation
    const aiDecision = await moderateReview({ rating, comment }, resourceTitle, admin);

    // Store AI reasoning; only auto-approve on high-confidence approval
    const newStatus = aiDecision.autoApprove ? 'approved' : 'pending';

    await admin
        .from('resource_reviews')
        .update({
            status: newStatus,
            ai_moderation_result: aiDecision,
        })
        .eq('id', review.id);

    return NextResponse.json({
        review: { ...review, status: newStatus },
        aiDecision: newStatus,
    });
}

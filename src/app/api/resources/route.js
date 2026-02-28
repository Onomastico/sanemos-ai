import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { moderateResource } from '@/lib/moderation';

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
        title, description, type, worldview,
        externalUrl, coverUrl, authorOrCreator,
        focusTheme, availability, lossTypes,
    } = body;

    if (!title || !type) {
        return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Insert as pending
    const { data: resource, error: insertError } = await admin
        .from('resources')
        .insert({
            title,
            description: description || null,
            type,
            worldview: worldview || 'universal',
            external_url: externalUrl || null,
            cover_url: coverUrl || null,
            author_or_creator: authorOrCreator || null,
            focus_theme: focusTheme || null,
            availability: availability || null,
            created_by: user.id,
            status: 'pending',
        })
        .select()
        .single();

    if (insertError) {
        console.error('Resource insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
    }

    // Insert loss types
    if (lossTypes && lossTypes.length > 0) {
        await admin.from('resource_loss_types').insert(
            lossTypes.map((lt) => ({ resource_id: resource.id, loss_type: lt }))
        );
    }

    // Run AI moderation
    const aiDecision = await moderateResource(resource, admin);

    // Always store the AI reasoning; only promote to approved if high-confidence approval
    // and no cover URL (images require human verification)
    const newStatus = aiDecision.autoApprove ? 'approved' : 'pending';

    await admin
        .from('resources')
        .update({
            status: newStatus,
            ai_moderation_result: aiDecision,
        })
        .eq('id', resource.id);

    return NextResponse.json({
        resource: { ...resource, status: newStatus },
        aiDecision: newStatus, // 'approved' or 'pending' — never expose 'reject' to client
    });
}

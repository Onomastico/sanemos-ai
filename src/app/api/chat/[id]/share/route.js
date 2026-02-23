import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/chat/[id]/share — update visibility, tags, and shares
export async function PATCH(request, { params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a participant. RLS 'UPDATE' handles this, but we double check.
    // We use the admin client because the RLS join on conversation_participants might fail 
    // depending on the exact policy formulation and whether the user is the only participant.
    const admin = createAdminClient();
    const { data: participantData, error: participantError } = await admin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (participantError) {
        console.error("Participant check error:", participantError);
    }

    if (!participantData) {
        return NextResponse.json({ error: 'Forbidden. You are not a participant in this conversation.' }, { status: 403 });
    }

    const body = await request.json();
    const { visibility, loss_type, worldview, shared_with_user_ids } = body;

    // 1. Update the conversation fields
    const updatePayload = {};
    if (visibility !== undefined) updatePayload.visibility = visibility;
    if (loss_type !== undefined) updatePayload.loss_type = loss_type || null;
    if (worldview !== undefined) updatePayload.worldview = worldview || null;

    if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
            .from('conversations')
            .update(updatePayload)
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
    }

    // 2. Manage explicit user shares
    // If visibility is set to 'shared', we expect an array of user IDs
    if (visibility === 'shared' && Array.isArray(shared_with_user_ids)) {
        // First delete existing shares
        await supabase
            .from('conversation_shares')
            .delete()
            .eq('conversation_id', id);

        // Insert new shares
        if (shared_with_user_ids.length > 0) {
            const sharesToInsert = shared_with_user_ids.map(targetUserId => ({
                conversation_id: id,
                shared_with_user_id: targetUserId,
                shared_by_user_id: user.id
            }));

            const { error: shareError } = await supabase
                .from('conversation_shares')
                .insert(sharesToInsert);

            if (shareError) {
                return NextResponse.json({ error: shareError.message }, { status: 500 });
            }
        }
    }

    // Return the updated conversation
    const { data: updatedConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

    return NextResponse.json({ conversation: updatedConv });
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAllAgents } from '@/lib/ai/agents';

// GET /api/companions/stats
export async function GET() {
    try {
        const admin = createAdminClient();
        const agents = getAllAgents();

        // We want to count how many distinct human conversation_participants
        // have interacted with each type of AI agent.

        const stats = {};

        for (const agent of agents) {
            // Get all AI conversations for this agent
            const { data: convs, error: convError } = await admin
                .from('conversations')
                .select('id')
                .eq('type', 'ai')
                .eq('ai_agent_type', agent.id);

            if (convError) continue;

            const convIds = convs.map(c => c.id);
            if (convIds.length === 0) {
                stats[agent.id] = 0;
                continue;
            }

            // Get distinct user_ids in these conversations
            const { data: parts, error: partError } = await admin
                .from('conversation_participants')
                .select('user_id')
                .in('conversation_id', convIds);

            if (partError) {
                stats[agent.id] = 0;
            } else {
                // Count unique users
                const uniqueUsers = new Set(parts.map(p => p.user_id));
                stats[agent.id] = uniqueUsers.size;
            }
        }

        return NextResponse.json({ stats });
    } catch (e) {
        console.error('Error fetching companion stats:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

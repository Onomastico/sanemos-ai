import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const admin = createAdminClient();

        // 1. Get users count (profiles)
        const { count: usersCount, error: usersError } = await admin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // 2. Get resources count (approved)
        const { count: resourcesCount, error: resourcesError } = await admin
            .from('resources')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        if (resourcesError) throw resourcesError;

        // 3. Get therapists count (verified)
        const { count: therapistsCount, error: therapistsError } = await admin
            .from('therapists')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', true);

        if (therapistsError) throw therapistsError;

        return Response.json({
            users: usersCount || 0,
            resources: resourcesCount || 0,
            therapists: therapistsCount || 0
        });

    } catch (error) {
        console.error('API /stats Detailed Error:', error);
        return Response.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}

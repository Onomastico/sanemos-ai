import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Check if the current user is staff (admin or moderator).
 * Returns { user, isAdmin, isModerator, isStaff, role }
 */
export async function checkStaff() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, isAdmin: false, isModerator: false, isStaff: false, role: null };

    const admin = createAdminClient();
    const { data: profile } = await admin
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.is_admin === true;
    const isModerator = profile?.role === 'moderator';
    const isStaff = isAdmin || isModerator;

    return { user, isAdmin, isModerator, isStaff, role: profile?.role || 'user' };
}

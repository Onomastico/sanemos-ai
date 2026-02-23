import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';

// GET /api/admin/check — returns admin/moderator status
export async function GET() {
    const { isAdmin, isModerator, isStaff, role } = await checkStaff();
    return NextResponse.json({ isAdmin, isModerator, isStaff, role });
}

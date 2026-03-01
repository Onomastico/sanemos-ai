import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/volunteer-shifts?week=YYYY-WW
// Returns all shifts for a given ISO week (Mon-Sun)
export async function GET(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week'); // e.g. "2025-W12"

    let startOfWeek, endOfWeek;

    if (week) {
        // Parse ISO week string
        const [yearStr, weekStr] = week.split('-W');
        const year = parseInt(yearStr);
        const weekNum = parseInt(weekStr);
        // Get Monday of that week
        const jan4 = new Date(year, 0, 4);
        const dayOfWeek = jan4.getDay() || 7; // 1=Mon
        const monday = new Date(jan4);
        monday.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNum - 1) * 7);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        startOfWeek = monday.toISOString();
        endOfWeek = sunday.toISOString();
    } else {
        // Default to current week
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        startOfWeek = monday.toISOString();
        endOfWeek = sunday.toISOString();
    }

    const admin = createAdminClient();
    const { data: shifts, error } = await admin
        .from('volunteer_shifts')
        .select(`
            *,
            volunteer_applications(id, name, email, status),
            volunteer_checkins(id, checked_in_at, checked_out_at)
        `)
        .gte('start_time', startOfWeek)
        .lte('start_time', endOfWeek)
        .order('start_time', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ shifts: shifts || [], weekStart: startOfWeek });
}

// POST /api/admin/volunteer-shifts
export async function POST(request) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const { volunteer_id, start_time, end_time, notes } = body;

    if (!volunteer_id || !start_time || !end_time) {
        return NextResponse.json({ error: 'volunteer_id, start_time y end_time son requeridos.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify volunteer is approved
    const { data: vol } = await admin
        .from('volunteer_applications')
        .select('id, status')
        .eq('id', volunteer_id)
        .single();

    if (!vol || vol.status !== 'approved') {
        return NextResponse.json({ error: 'Solo se pueden asignar turnos a voluntarios aprobados.' }, { status: 400 });
    }

    const { data: shift, error } = await admin
        .from('volunteer_shifts')
        .insert({ volunteer_id, start_time, end_time, notes: notes || null })
        .select(`
            *,
            volunteer_applications(id, name, email)
        `)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ shift }, { status: 201 });
}

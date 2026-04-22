import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { fetchAdminStats } from '@/lib/supabase/queries';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = req.nextUrl;
  const period = (searchParams.get('period') ?? 'week') as 'day' | 'week' | 'month';
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const stats = await fetchAdminStats(supabase, period, date);
  return NextResponse.json(stats);
}

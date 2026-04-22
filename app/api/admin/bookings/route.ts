import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { fetchAllBookingsAdmin } from '@/lib/supabase/queries';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '0');
  const roomId = searchParams.get('roomId') ?? undefined;
  const status = (searchParams.get('status') ?? 'all') as 'active' | 'cancelled' | 'all';
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const result = await fetchAllBookingsAdmin(supabase, { page, roomId, status, from, to, search });
  return NextResponse.json(result);
}

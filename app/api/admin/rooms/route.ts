import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { fetchAllRoomsAdmin } from '@/lib/supabase/queries';
import { createRoom } from '@/lib/supabase/mutations';
import type { CreateRoomInput } from '@/lib/supabase/mutations';

export async function GET() {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const rooms = await fetchAllRoomsAdmin(supabase);
  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json() as CreateRoomInput;
  const result = await createRoom(supabase, body);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}

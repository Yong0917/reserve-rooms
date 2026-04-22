import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { fetchAllUsersAdmin } from '@/lib/supabase/queries';

export async function GET() {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const users = await fetchAllUsersAdmin(supabase);
  return NextResponse.json(users);
}

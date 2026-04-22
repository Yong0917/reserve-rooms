import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { updateUserRole } from '@/lib/supabase/mutations';
import type { UserRole } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;

  if (id === guard.userId) {
    return NextResponse.json({ error: '자신의 역할은 변경할 수 없습니다' }, { status: 400 });
  }

  const body = await req.json() as { role: UserRole };
  if (!['employee', 'admin'].includes(body.role)) {
    return NextResponse.json({ error: '유효하지 않은 역할입니다' }, { status: 400 });
  }

  const result = await updateUserRole(supabase, id, body.role);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

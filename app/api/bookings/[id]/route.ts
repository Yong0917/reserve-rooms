import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateBooking, cancelBooking, cancelRecurringBooking, type RecurringCancelScope } from '@/lib/supabase/mutations';
import type { BookingTag } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    title: string;
    roomId: string;
    date: string;
    startH: number;
    endH: number;
    attendees: string[];
    tag?: BookingTag;
  };

  const result = await updateBooking(supabase, id, body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get('scope') ?? 'this') as RecurringCancelScope;
  const recurringId = searchParams.get('recurringId') ?? undefined;
  const fromDate = searchParams.get('fromDate') ?? undefined;

  let result: { error?: string };
  if (recurringId && scope !== 'this') {
    result = await cancelRecurringBooking(supabase, recurringId, scope, fromDate, id);
  } else if (recurringId && scope === 'this') {
    result = await cancelBooking(supabase, id);
  } else {
    result = await cancelBooking(supabase, id);
  }

  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

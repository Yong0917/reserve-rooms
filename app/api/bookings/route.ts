import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBooking } from '@/lib/supabase/mutations';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json() as {
    title: string;
    roomId: string;
    date: string;
    startH: number;
    endH: number;
    attendees: string[];
    rrule: string;
    tag?: string;
  };

  if (body.rrule && body.rrule !== 'none') {
    // 반복 예약은 /api/recurring 사용
    return NextResponse.json({ error: '반복 예약은 /api/recurring을 사용하세요' }, { status: 400 });
  }

  const result = await createBooking(supabase, {
    title: body.title,
    roomId: body.roomId,
    date: body.date,
    startH: body.startH,
    endH: body.endH,
    attendees: body.attendees,
    userId: user.id,
    tag: body.tag as import('@/lib/types').BookingTag | undefined,
  });

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}

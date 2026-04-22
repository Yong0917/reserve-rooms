import { NextRequest, NextResponse } from 'next/server';
import { RRule, Weekday } from 'rrule';
import { createClient } from '@/lib/supabase/server';
import { createRecurringBooking } from '@/lib/supabase/mutations';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function buildRRule(rruleKey: string, startDate: Date): { rule: RRule; str: string } {
  const kst = new Date(startDate.getTime() + KST_OFFSET_MS);
  const wdMap: Record<string, Weekday> = {
    0: RRule.SU, 1: RRule.MO, 2: RRule.TU, 3: RRule.WE, 4: RRule.TH, 5: RRule.FR, 6: RRule.SA,
  };
  const wd = wdMap[kst.getUTCDay()];

  let rule: RRule;
  switch (rruleKey) {
    case 'daily':
      rule = new RRule({ freq: RRule.DAILY, dtstart: startDate, count: 365 });
      break;
    case 'weekly':
      rule = new RRule({ freq: RRule.WEEKLY, byweekday: wd, dtstart: startDate, count: 52 });
      break;
    case 'biweekly':
      rule = new RRule({ freq: RRule.WEEKLY, interval: 2, byweekday: wd, dtstart: startDate, count: 26 });
      break;
    case 'monthly':
      rule = new RRule({ freq: RRule.MONTHLY, bymonthday: kst.getUTCDate(), dtstart: startDate, count: 12 });
      break;
    default:
      rule = new RRule({ freq: RRule.WEEKLY, byweekday: wd, dtstart: startDate, count: 52 });
  }
  return { rule, str: rule.toString() };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json() as {
    title: string;
    roomId: string;
    date: string;       // YYYY-MM-DD 시작일
    startH: number;
    duration: number;   // minutes
    rrule: string;      // 'daily' | 'weekly' | 'biweekly' | 'monthly'
  };

  // 시작일 UTC 변환
  const [y, m, d] = body.date.split('-').map(Number);
  const startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - KST_OFFSET_MS);

  const { rule, str } = buildRRule(body.rrule, startDate);
  const occurrences = rule.all();

  // occurrences는 UTC 기준 Date 배열 → KST 날짜 문자열로 변환
  const dates = occurrences.map((dt) => {
    const kst = new Date(dt.getTime() + KST_OFFSET_MS);
    const yy = kst.getUTCFullYear();
    const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  });

  const result = await createRecurringBooking(supabase, {
    title: body.title,
    roomId: body.roomId,
    startH: body.startH,
    duration: body.duration,
    rruleStr: str,
    userId: user.id,
    dates,
  });

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}

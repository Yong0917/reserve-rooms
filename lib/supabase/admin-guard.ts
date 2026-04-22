import type { SupabaseClient } from '@supabase/supabase-js';

export async function requireAdmin(
  supabase: SupabaseClient,
): Promise<{ error: string; status: number } | { userId: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '인증 필요', status: 401 };

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!data || (data as { role: string }).role !== 'admin') {
    return { error: '관리자 권한 필요', status: 403 };
  }

  return { userId: user.id };
}

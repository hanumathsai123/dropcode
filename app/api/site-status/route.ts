import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await adminSupabase()
    .from('site_settings')
    .select('launch_announcement_enabled, launch_announcement_message')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { enabled: false, message: '' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    {
      enabled: data?.launch_announcement_enabled ?? false,
      message: data?.launch_announcement_message ?? '',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

function isSettingsTableMissing(error: { code?: string; message?: string }) {
  return error.code === 'PGRST205' || error.message?.includes('site_settings');
}

export async function GET() {
  try {
    const { data, error } = await adminSupabase()
      .from('site_settings')
      .select('launch_announcement_enabled, launch_announcement_message')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      if (isSettingsTableMissing(error)) {
        return NextResponse.json(
          { enabled: false, message: '', available: true },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
      console.error('Site status lookup failed:', error);
      return NextResponse.json(
        { enabled: false, message: '', available: false },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      {
        enabled: data?.launch_announcement_enabled ?? false,
        message: data?.launch_announcement_message ?? '',
        available: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      isSettingsTableMissing({
        code: 'code' in error ? String(error.code) : undefined,
        message: String(error.message),
      })
    ) {
      return NextResponse.json(
        { enabled: false, message: '', available: true },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    console.error('Site status lookup failed:', error);
    return NextResponse.json(
      { enabled: false, message: '', available: false },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
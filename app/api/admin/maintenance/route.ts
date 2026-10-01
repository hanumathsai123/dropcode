import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { validSession } from '@/lib/security';

function authorized(request: NextRequest) {
  return validSession(request.cookies.get('codedrop_admin')?.value);
}

function settingsError(error: { code?: string; message?: string }) {
  const tableMissing = error.code === 'PGRST205' || error.message?.includes('site_settings');
  return NextResponse.json(
    {
      error: tableMissing
        ? 'Run the latest supabase/migrations/003_site_settings.sql in the Supabase SQL Editor to enable service and launch controls.'
        : 'Could not load maintenance settings.',
    },
    { status: tableMissing ? 503 : 500 },
  );
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await adminSupabase()
    .from('site_settings')
    .select('maintenance_enabled, maintenance_message, launch_announcement_enabled, launch_announcement_message')
    .eq('id', 1)
    .maybeSingle();
  if (error) return settingsError(error);

  return NextResponse.json({
    enabled: data?.maintenance_enabled ?? false,
    message: data?.maintenance_message ?? '',
    launchAnnouncementEnabled: data?.launch_announcement_enabled ?? false,
    launchAnnouncementMessage: data?.launch_announcement_message ?? '',
  });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'Choose whether maintenance is enabled.' }, { status: 400 });
    }
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (message.length > 280) {
      return NextResponse.json({ error: 'The notice must be 280 characters or fewer.' }, { status: 400 });
    }
    if (typeof body.launchAnnouncementEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Choose whether the launch announcement is visible.' }, { status: 400 });
    }
    const launchAnnouncementMessage = typeof body.launchAnnouncementMessage === 'string'
      ? body.launchAnnouncementMessage.trim()
      : '';
    if (launchAnnouncementMessage.length > 280) {
      return NextResponse.json({ error: 'The launch announcement must be 280 characters or fewer.' }, { status: 400 });
    }

    const { data, error } = await adminSupabase()
      .from('site_settings')
      .upsert({
        id: 1,
        maintenance_enabled: body.enabled,
        maintenance_message: message || 'We are making a few improvements. Please check back shortly.',
        launch_announcement_enabled: body.launchAnnouncementEnabled,
        launch_announcement_message: launchAnnouncementMessage || 'DropCodes is live! We launched today. Welcome aboard.',
        updated_at: new Date().toISOString(),
      })
      .select('maintenance_enabled, maintenance_message, launch_announcement_enabled, launch_announcement_message')
      .single();
    if (error) return settingsError(error);

    return NextResponse.json({
      enabled: data.maintenance_enabled,
      message: data.maintenance_message,
      launchAnnouncementEnabled: data.launch_announcement_enabled,
      launchAnnouncementMessage: data.launch_announcement_message,
    });
  } catch {
    return NextResponse.json({ error: 'Could not save maintenance settings.' }, { status: 500 });
  }
}
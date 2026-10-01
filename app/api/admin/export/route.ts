import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { validSession } from '@/lib/security';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
	if (!validSession(request.cookies.get('codedrop_admin')?.value)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data, error } = await adminSupabase()
		.from('shares')
		.select('*')
		.order('created_at', { ascending: false });
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	const rows = (data || []).map((share) => ({
		Share_ID: share.id,
		Share_Code: share.share_code,
		Type: share.kind,
		Title: share.title || '',
		File_Name: share.file_name || '',
		File_Size_Bytes: share.file_size || '',
		MIME_Type: share.mime_type || '',
		Created_At: share.created_at,
		Expires_At: share.expires_at,
		Max_Views: share.max_views,
		Views: share.view_count,
		Downloads: share.download_count || 0,
		Last_Accessed: share.last_accessed_at || '',
		Content: share.kind === 'text' ? share.encrypted_content || '' : '[DOCUMENT]',
	}));
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Shares');
	const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

	return new NextResponse(output, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="DropCodes_Shares.xlsx"',
		},
	});
}

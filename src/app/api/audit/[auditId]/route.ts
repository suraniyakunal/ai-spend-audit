import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/audit/[auditId] — Fetch a completed audit by ID
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ auditId: string }> }
) {
    try {
        const { auditId } = await params;

        // ── Validate UUID format ──
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(auditId)) {
            return NextResponse.json({ error: 'Invalid audit ID format' }, { status: 400 });
        }

        // ── Fetch from Supabase ──
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('audits')
            .select('*')
            .eq('id', auditId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
        }

        return NextResponse.json({ auditResult: data.result_json }, { status: 200 });
    } catch (err) {
        console.error('Audit fetch error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

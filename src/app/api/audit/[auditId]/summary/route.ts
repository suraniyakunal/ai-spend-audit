import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateAuditSummary } from '@/lib/ai-summary';
import { AuditResult } from '@/lib/types';

/**
 * POST /api/audit/[auditId]/summary — Generate an AI summary for an audit
 */
export async function POST(
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

        // ── Fetch audit from Supabase ──
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('audits')
            .select('result_json')
            .eq('id', auditId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
        }

        const auditResult = data.result_json as AuditResult;

        // ── Generate summary (with automatic fallback) ──
        const { summary, isAI } = await generateAuditSummary(auditResult);

        return NextResponse.json({ summary, isAI }, { status: 200 });
    } catch (err) {
        console.error('Summary API error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

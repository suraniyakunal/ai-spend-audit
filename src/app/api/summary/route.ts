import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateAuditSummary } from '@/lib/ai-summary';
import { summaryInputSchema } from '@/lib/schemas';
import { AuditResult } from '@/lib/types';

/**
 * POST /api/summary — Generate an AI summary for an audit (standalone route)
 * Accepts { auditId } in the request body.
 */
export async function POST(request: NextRequest) {
    try {
        // ── Parse body ──
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // ── Validate with zod ──
        const parsed = summaryInputSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Invalid input';
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { auditId } = parsed.data;

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

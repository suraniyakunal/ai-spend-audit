import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit-engine';
import { createServerSupabaseClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limiter';
import { auditInputSchema } from '@/lib/schemas';
import { AuditInput } from '@/lib/types';

/**
 * POST /api/audit — Run an AI spend audit
 */
export async function POST(request: NextRequest) {
    try {
        // ── Rate limiting ──
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || '127.0.0.1';
        const { allowed, remaining } = checkRateLimit(ip, 10, 60 * 60 * 1000);

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: { 'Retry-After': '3600', 'X-RateLimit-Remaining': '0' },
                }
            );
        }

        // ── Parse body ──
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // ── Validate with zod ──
        const parsed = auditInputSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Invalid input';
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const input: AuditInput = parsed.data;

        // ── Run audit engine ──
        const auditResult = runAudit(input);

        // ── Persist to Supabase ──
        try {
            const supabase = createServerSupabaseClient();
            const { error: dbError } = await supabase.from('audits').insert({
                id: auditResult.id,
                input_json: input,
                result_json: auditResult,
            });

            if (dbError) {
                console.error('Supabase insert error:', dbError);
                // Continue — the audit result is still valid even if persistence fails
            }
        } catch (dbErr) {
            console.error('Supabase connection error:', dbErr);
        }

        return NextResponse.json(
            { auditResult },
            {
                status: 200,
                headers: { 'X-RateLimit-Remaining': String(remaining) },
            }
        );
    } catch (err) {
        console.error('Audit API error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { leadInputSchema, isHoneypotFilled } from '@/lib/schemas';

/**
 * POST /api/lead — Capture a lead after viewing audit results
 */
export async function POST(request: NextRequest) {
    try {
        // ── Parse body ──
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // ── Validate with zod ──
        const parsed = leadInputSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Invalid input';
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { auditId, email, companyName, role, teamSize, website } = parsed.data;

        // ── Honeypot check — reject bots ──
        if (isHoneypotFilled(website)) {
            // Silently accept but don't store — bots think it worked
            return NextResponse.json({ success: true }, { status: 201 });
        }

        // ── Persist to Supabase ──
        const supabase = createServerSupabaseClient();
        const { error: dbError } = await supabase.from('leads').insert({
            audit_id: auditId,
            email: email.trim().toLowerCase(),
            company_name: companyName?.trim() || null,
            role: role?.trim() || null,
            team_size: teamSize ?? null,
        });

        if (dbError) {
            console.error('Lead insert error:', dbError);
            return NextResponse.json(
                { error: 'Failed to save lead' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err) {
        console.error('Lead API error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

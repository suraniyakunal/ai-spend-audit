import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AuditResult } from '@/lib/types';
import ResultsClient from './results-client';

type Props = {
    params: Promise<{ auditId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { auditId } = await params;
    try {
        const supabase = createServerSupabaseClient();
        const { data } = await supabase
            .from('audits')
            .select('result_json')
            .eq('id', auditId)
            .single();

        if (data?.result_json) {
            const result = data.result_json as AuditResult;
            const monthly = result.totalMonthlySavings.toLocaleString('en-US', { maximumFractionDigits: 0 });
            return {
                title: `My AI Spend Audit — Save $${monthly}/month`,
                description: `I audited my team's AI tool spend and found $${monthly} in monthly savings.`,
                openGraph: {
                    title: `My AI Spend Audit — Save $${monthly}/month`,
                    description: `I audited my team's AI tool spend and found $${monthly} in monthly savings.`,
                },
            };
        }
    } catch {
        // Fall through to defaults
    }

    return {
        title: 'AI Spend Audit Results',
        description: 'View your AI tool spend audit results.',
    };
}

export default async function ResultsPage({ params }: Props) {
    const { auditId } = await params;

    // ── Validate UUID ──
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(auditId)) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-white mb-2">Invalid Audit ID</h1>
                <p className="text-gray-400">The audit ID in the URL is not valid.</p>
                <a href="/" className="btn-primary inline-block mt-6">Run a New Audit</a>
            </div>
        );
    }

    // ── Fetch audit ──
    let auditResult: AuditResult | null = null;
    try {
        const supabase = createServerSupabaseClient();
        const { data } = await supabase
            .from('audits')
            .select('result_json')
            .eq('id', auditId)
            .single();

        if (data?.result_json) {
            auditResult = data.result_json as AuditResult;
        }
    } catch {
        // Fall through to not-found state
    }

    if (!auditResult) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-white mb-2">Audit Not Found</h1>
                <p className="text-gray-400">
                    This audit may have expired or the link is incorrect.
                </p>
                <a href="/" className="btn-primary inline-block mt-6">Run a New Audit</a>
            </div>
        );
    }

    return <ResultsClient auditResult={auditResult} auditId={auditId} />;
}

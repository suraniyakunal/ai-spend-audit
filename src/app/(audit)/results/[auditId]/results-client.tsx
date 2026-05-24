'use client';

import { useState, useEffect } from 'react';
import { AuditResult } from '@/lib/types';

type Props = {
    auditResult: AuditResult;
    auditId: string;
};

export default function ResultsClient({ auditResult, auditId }: Props) {
    const [summary, setSummary] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [isAI, setIsAI] = useState(false);
    const [copied, setCopied] = useState(false);

    // Lead capture state
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [leadSubmitted, setLeadSubmitted] = useState(false);
    const [leadError, setLeadError] = useState<string | null>(null);
    const [leadSubmitting, setLeadSubmitting] = useState(false);

    // ── Fetch AI summary on mount ──
    useEffect(() => {
        async function fetchSummary() {
            try {
                const res = await fetch(`/api/audit/${auditId}/summary`, { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data.summary);
                    setIsAI(data.isAI);
                } else {
                    setSummary('Unable to load summary. Please try refreshing the page.');
                }
            } catch {
                setSummary('Unable to load summary. Please try refreshing the page.');
            } finally {
                setSummaryLoading(false);
            }
        }
        fetchSummary();
    }, [auditId]);

    // ── Share handler ──
    const handleShare = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Lead submit ──
    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLeadError(null);
        setLeadSubmitting(true);

        try {
            const res = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auditId,
                    email,
                    companyName: companyName || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to submit');
            }

            setLeadSubmitted(true);
        } catch (err) {
            setLeadError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setLeadSubmitting(false);
        }
    };

    const monthly = auditResult.totalMonthlySavings.toLocaleString('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    });
    const annual = auditResult.totalAnnualSavings.toLocaleString('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    });

    return (
        <div className="space-y-10">
            {/* ─── Hero Savings ─── */}
            <section className="text-center animate-fade-in-up">
                <div className={`savings-badge ${auditResult.savingsLevel} mx-auto mb-4`}>
                    {auditResult.savingsLevel === 'high' && '🔥 High Savings Opportunity'}
                    {auditResult.savingsLevel === 'medium' && '💡 Moderate Savings Found'}
                    {auditResult.savingsLevel === 'low' && '✓ Minor Optimizations'}
                    {auditResult.savingsLevel === 'none' && '✓ Well Optimized'}
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
                    You could save{' '}
                    <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                        {monthly}/mo
                    </span>
                </h1>
                <p className="text-xl text-gray-400">
                    That&apos;s <span className="text-white font-semibold">{annual}/year</span> back in your budget
                </p>
            </section>

            {/* ─── Per-Tool Breakdown ─── */}
            <section className="animate-fade-in-up-delay-1">
                <h2 className="text-xl font-bold text-white mb-4">Tool-by-Tool Breakdown</h2>
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Tool</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Current Plan</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Monthly Spend</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Recommendation</th>
                                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Savings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditResult.perTool.map((tool, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="py-3 px-4 text-white font-medium">{tool.toolName}</td>
                                        <td className="py-3 px-4 text-gray-300">{tool.currentPlan}</td>
                                        <td className="py-3 px-4 text-right text-gray-300">
                                            ${tool.currentMonthlySpend.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 max-w-xs">
                                            <p className="line-clamp-2">{tool.recommendation}</p>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {tool.estimatedMonthlySavings > 0 ? (
                                                <span className="text-emerald-400 font-semibold">
                                                    -${tool.estimatedMonthlySavings.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">$0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-white/10">
                                    <td colSpan={4} className="py-3 px-4 text-white font-bold">
                                        Total Monthly Savings
                                    </td>
                                    <td className="py-3 px-4 text-right text-emerald-400 font-bold text-lg">
                                        {monthly}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </section>

            {/* ─── AI Summary ─── */}
            <section className="animate-fade-in-up-delay-2">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-white">Executive Summary</h2>
                    {!summaryLoading && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                            {isAI ? '✨ AI-generated' : '📊 Template'}
                        </span>
                    )}
                </div>
                <div className="glass-card p-6">
                    {summaryLoading ? (
                        <div className="space-y-3">
                            <div className="skeleton h-4 w-3/4" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-5/6" />
                            <div className="skeleton h-4 w-2/3" />
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {summary}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── CTA based on savings level ─── */}
            <section className="animate-fade-in-up-delay-3">
                {auditResult.savingsLevel === 'high' ? (
                    <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">
                                    🚀 Get these savings automatically via Credex
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Our team can negotiate enterprise credits and implement these
                                    optimizations for you — saving your team {monthly}/month.
                                </p>
                            </div>
                            <a
                                href="https://credex.co"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary whitespace-nowrap"
                            >
                                Get These Savings →
                            </a>
                        </div>
                    </div>
                ) : auditResult.savingsLevel === 'none' || auditResult.savingsLevel === 'low' ? (
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-1">
                            ✅ You&apos;re spending well
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Your AI tool stack looks well-optimized. Want alerts when better options appear?
                            Sign up below and we&apos;ll let you know.
                        </p>
                    </div>
                ) : null}
            </section>

            {/* ─── Lead Capture ─── */}
            <section>
                {leadSubmitted ? (
                    <div className="glass-card p-6 text-center border-emerald-500/20">
                        <div className="text-3xl mb-2">🎉</div>
                        <h3 className="text-lg font-bold text-white mb-1">Thanks!</h3>
                        <p className="text-gray-400 text-sm">
                            We&apos;ll send you personalized savings tips and new optimization opportunities.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleLeadSubmit} className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-1">
                            Get personalized savings tips
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Enter your email to receive a detailed report and future optimization alerts.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                id="lead-email"
                                type="email"
                                required
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field sm:col-span-1"
                            />
                            <input
                                id="lead-company"
                                type="text"
                                placeholder="Company (optional)"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="input-field sm:col-span-1"
                            />
                            <button
                                type="submit"
                                disabled={leadSubmitting}
                                className="btn-primary sm:col-span-1"
                                id="lead-submit-btn"
                            >
                                {leadSubmitting ? 'Saving…' : 'Get Tips'}
                            </button>
                        </div>
                        {/* Honeypot */}
                        <input name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                        {leadError && (
                            <p className="text-red-400 text-sm mt-2">{leadError}</p>
                        )}
                    </form>
                )}
            </section>

            {/* ─── Share ─── */}
            <div className="flex justify-center">
                <button
                    onClick={handleShare}
                    className="btn-secondary text-sm flex items-center gap-2"
                    id="share-btn"
                >
                    {copied ? (
                        <>
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Link Copied!
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share Results
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

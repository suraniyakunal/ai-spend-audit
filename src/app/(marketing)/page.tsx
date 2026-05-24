'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Inline pricing data for client-side use ───
// Mirrors src/lib/pricing-data.ts but used client-side for form rendering
type Plan = { id: string; name: string };
type Tool = { id: string; name: string; plans: Plan[] };

const TOOLS: Tool[] = [
    {
        id: 'cursor', name: 'Cursor', plans: [
            { id: 'cursor-hobby', name: 'Hobby' },
            { id: 'cursor-pro', name: 'Pro' },
            { id: 'cursor-business', name: 'Business' },
        ],
    },
    {
        id: 'github-copilot', name: 'GitHub Copilot', plans: [
            { id: 'copilot-individual', name: 'Individual' },
            { id: 'copilot-business', name: 'Business' },
            { id: 'copilot-enterprise', name: 'Enterprise' },
        ],
    },
    {
        id: 'claude', name: 'Claude (Anthropic)', plans: [
            { id: 'claude-free', name: 'Free' },
            { id: 'claude-pro', name: 'Pro' },
            { id: 'claude-max', name: 'Max' },
            { id: 'claude-team', name: 'Team' },
            { id: 'claude-enterprise', name: 'Enterprise' },
        ],
    },
    {
        id: 'chatgpt', name: 'ChatGPT (OpenAI)', plans: [
            { id: 'chatgpt-plus', name: 'Plus' },
            { id: 'chatgpt-team', name: 'Team' },
            { id: 'chatgpt-enterprise', name: 'Enterprise' },
        ],
    },
    {
        id: 'anthropic-api', name: 'Anthropic API', plans: [
            { id: 'anthropic-api-light', name: 'Light Usage' },
            { id: 'anthropic-api-medium', name: 'Medium Usage' },
            { id: 'anthropic-api-heavy', name: 'Heavy Usage' },
        ],
    },
    {
        id: 'openai-api', name: 'OpenAI API', plans: [
            { id: 'openai-api-light', name: 'Light Usage' },
            { id: 'openai-api-medium', name: 'Medium Usage' },
            { id: 'openai-api-heavy', name: 'Heavy Usage' },
        ],
    },
    {
        id: 'gemini', name: 'Gemini', plans: [
            { id: 'gemini-free', name: 'Free' },
            { id: 'gemini-pro', name: 'Pro (Advanced)' },
            { id: 'gemini-ultra', name: 'Ultra' },
            { id: 'gemini-api-light', name: 'API Light' },
            { id: 'gemini-api-medium', name: 'API Medium' },
        ],
    },
    {
        id: 'windsurf', name: 'Windsurf', plans: [
            { id: 'windsurf-free', name: 'Free' },
            { id: 'windsurf-pro', name: 'Pro' },
            { id: 'windsurf-teams', name: 'Teams' },
        ],
    },
];

const USE_CASES = [
    { value: 'coding', label: 'Coding & Development' },
    { value: 'writing', label: 'Writing & Content' },
    { value: 'data', label: 'Data & Analytics' },
    { value: 'research', label: 'Research' },
    { value: 'mixed', label: 'Mixed / Multiple' },
];

const STORAGE_KEY = 'ai-spend-audit-form';
const MAX_TOOLS = 8;

type ToolEntry = {
    toolId: string;
    planId: string;
    seats: number;
    monthlySpend: number;
};

type FormState = {
    tools: ToolEntry[];
    teamSize: number;
    primaryUseCase: string;
};

const defaultTool: ToolEntry = { toolId: '', planId: '', seats: 1, monthlySpend: 0 };
const defaultForm: FormState = {
    tools: [{ ...defaultTool }],
    teamSize: 1,
    primaryUseCase: 'coding',
};

export default function LandingPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Load from localStorage ──
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setForm(JSON.parse(saved));
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // ── Persist to localStorage ──
    const persistForm = useCallback((updated: FormState) => {
        setForm(updated);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignore storage errors
        }
    }, []);

    // ── Tool management ──
    const addTool = () => {
        if (form.tools.length >= MAX_TOOLS) return;
        persistForm({ ...form, tools: [...form.tools, { ...defaultTool }] });
    };

    const removeTool = (index: number) => {
        if (form.tools.length <= 1) return;
        const updated = form.tools.filter((_, i) => i !== index);
        persistForm({ ...form, tools: updated });
    };

    const updateTool = (index: number, field: keyof ToolEntry, value: string | number) => {
        const updated = [...form.tools];
        updated[index] = { ...updated[index], [field]: value };

        // Reset planId when tool changes
        if (field === 'toolId') {
            updated[index].planId = '';
        }

        persistForm({ ...form, tools: updated });
    };

    // ── Submit ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Validate
            const incomplete = form.tools.some((t) => !t.toolId || !t.planId);
            if (incomplete) {
                setError('Please select a tool and plan for each entry.');
                setIsSubmitting(false);
                return;
            }

            // POST audit
            const auditRes = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!auditRes.ok) {
                const data = await auditRes.json().catch(() => ({}));
                throw new Error(data.error || `Audit failed (${auditRes.status})`);
            }

            const { auditResult } = await auditRes.json();

            // Fire summary generation in background (don't await)
            fetch(`/api/audit/${auditResult.id}/summary`, { method: 'POST' }).catch(() => { });

            // Clear saved form
            localStorage.removeItem(STORAGE_KEY);

            // Redirect to results
            router.push(`/audit/results/${auditResult.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    const getPlansForTool = (toolId: string): Plan[] => {
        return TOOLS.find((t) => t.id === toolId)?.plans || [];
    };

    const usedToolIds = form.tools.map((t) => t.toolId).filter(Boolean);

    return (
        <>
            {/* ─── Hero ─── */}
            <section className="relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-[100px]" />
                </div>

                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
                    <div className="animate-fade-in-up">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Free · 60 seconds · No account needed
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 animate-fade-in-up-delay-1">
                        Find out where you&apos;re{' '}
                        <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
                            overspending
                        </span>{' '}
                        on AI tools
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up-delay-2">
                        Most teams waste 20-40% of their AI tool budget on redundant subscriptions,
                        unused seats, or wrong-tier plans. Get a free audit in 60 seconds.
                    </p>
                </div>
            </section>

            {/* ─── Audit Form ─── */}
            <section id="audit-form" className="scroll-mt-20 pb-20">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 animate-fade-in-up-delay-3">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Your AI Tool Stack</h2>
                            <p className="text-gray-400">
                                Add the AI tools your team is using (up to {MAX_TOOLS}).
                            </p>
                        </div>

                        {/* Tool entries */}
                        <div className="space-y-4 mb-8">
                            {form.tools.map((tool, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 transition-all hover:border-white/10"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-400">
                                            Tool #{index + 1}
                                        </span>
                                        {form.tools.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeTool(index)}
                                                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor={`tool-${index}`} className="label-text">Tool</label>
                                            <select
                                                id={`tool-${index}`}
                                                value={tool.toolId}
                                                onChange={(e) => updateTool(index, 'toolId', e.target.value)}
                                                className="select-field"
                                            >
                                                <option value="">Select tool…</option>
                                                {TOOLS.map((t) => (
                                                    <option
                                                        key={t.id}
                                                        value={t.id}
                                                        disabled={usedToolIds.includes(t.id) && t.id !== tool.toolId}
                                                    >
                                                        {t.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={`plan-${index}`} className="label-text">Plan</label>
                                            <select
                                                id={`plan-${index}`}
                                                value={tool.planId}
                                                onChange={(e) => updateTool(index, 'planId', e.target.value)}
                                                disabled={!tool.toolId}
                                                className="select-field disabled:opacity-40"
                                            >
                                                <option value="">Select plan…</option>
                                                {getPlansForTool(tool.toolId).map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={`seats-${index}`} className="label-text">Seats</label>
                                            <input
                                                id={`seats-${index}`}
                                                type="number"
                                                min={1}
                                                max={10000}
                                                value={tool.seats}
                                                onChange={(e) => updateTool(index, 'seats', parseInt(e.target.value) || 1)}
                                                className="input-field"
                                                placeholder="1"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`spend-${index}`} className="label-text">Monthly Spend ($)</label>
                                            <input
                                                id={`spend-${index}`}
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={tool.monthlySpend || ''}
                                                onChange={(e) => updateTool(index, 'monthlySpend', parseFloat(e.target.value) || 0)}
                                                className="input-field"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {form.tools.length < MAX_TOOLS && (
                                <button
                                    type="button"
                                    onClick={addTool}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-gray-400 text-sm font-medium hover:border-brand-500/30 hover:text-brand-300 transition-all"
                                >
                                    + Add Another Tool
                                </button>
                            )}
                        </div>

                        {/* Team info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div>
                                <label htmlFor="team-size" className="label-text">Team Size</label>
                                <input
                                    id="team-size"
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={form.teamSize}
                                    onChange={(e) =>
                                        persistForm({ ...form, teamSize: parseInt(e.target.value) || 1 })
                                    }
                                    className="input-field"
                                    placeholder="5"
                                />
                            </div>
                            <div>
                                <label htmlFor="use-case" className="label-text">Primary Use Case</label>
                                <select
                                    id="use-case"
                                    value={form.primaryUseCase}
                                    onChange={(e) =>
                                        persistForm({ ...form, primaryUseCase: e.target.value })
                                    }
                                    className="select-field"
                                >
                                    {USE_CASES.map((uc) => (
                                        <option key={uc.value} value={uc.value}>
                                            {uc.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Honeypot */}
                        <input
                            name="website"
                            style={{ display: 'none' }}
                            tabIndex={-1}
                            autoComplete="off"
                        />

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full text-base py-4"
                            id="run-audit-btn"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Running Audit…
                                </span>
                            ) : (
                                'Run My Audit →'
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-3">
                            100% free. No account. Results in under 60 seconds.
                        </p>
                    </form>
                </div>
            </section>

            {/* ─── Social Proof ─── */}
            <section className="py-16 border-t border-white/5">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        <div className="glass-card p-6 hover:translate-y-[-2px] transition-transform">
                            <div className="text-3xl font-bold text-white mb-1">$2M+</div>
                            <div className="text-sm text-gray-400">Savings identified</div>
                        </div>
                        <div className="glass-card p-6 hover:translate-y-[-2px] transition-transform">
                            <div className="text-3xl font-bold text-white mb-1">1,200+</div>
                            <div className="text-sm text-gray-400">Audits completed</div>
                        </div>
                        <div className="glass-card p-6 hover:translate-y-[-2px] transition-transform">
                            <div className="text-3xl font-bold text-white mb-1">7 tools</div>
                            <div className="text-sm text-gray-400">In our database</div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

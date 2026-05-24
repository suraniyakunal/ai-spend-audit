import { describe, it, expect, vi } from 'vitest';
import { runAudit } from '@/lib/audit-engine';
import { isHoneypotFilled } from '@/lib/schemas';
import { AuditInput, AuditResult } from '@/lib/types';

// ─── Helper to build minimal audit input ───
function makeInput(overrides: Partial<AuditInput> = {}): AuditInput {
    return {
        tools: [],
        teamSize: 5,
        primaryUseCase: 'coding',
        ...overrides,
    };
}

describe('Audit Engine', () => {
    // ── Test 1: Team plan overpaying for 1 seat → savings detected ──
    it('detects savings when a team plan is used for 1 seat', () => {
        const input = makeInput({
            tools: [
                { toolId: 'claude', planId: 'claude-team', seats: 1, monthlySpend: 30 },
            ],
            teamSize: 1,
        });

        const result = runAudit(input);
        const claudeResult = result.perTool.find((t) => t.toolId === 'claude');

        expect(claudeResult).toBeDefined();
        expect(claudeResult!.estimatedMonthlySavings).toBeGreaterThan(0);
        expect(claudeResult!.recommendedPlan).toBeDefined();
    });

    // ── Test 2: Correct plan for usage → no savings ──
    it('returns no savings when plan is well-matched', () => {
        // Use Copilot Individual ($10/user) — cheapest paid IDE, no cheaper alternative
        const input = makeInput({
            tools: [
                { toolId: 'github-copilot', planId: 'copilot-individual', seats: 5, monthlySpend: 50 },
            ],
            teamSize: 5,
        });

        const result = runAudit(input);
        const copilotResult = result.perTool.find((t) => t.toolId === 'github-copilot');

        expect(copilotResult).toBeDefined();
        expect(copilotResult!.estimatedMonthlySavings).toBe(0);
        expect(copilotResult!.recommendation).toContain('optimized');
    });

    // ── Test 3: ChatGPT + Cursor redundancy for coding → drop ChatGPT ──
    it('recommends dropping ChatGPT when Cursor is also used for coding', () => {
        const input = makeInput({
            tools: [
                { toolId: 'chatgpt', planId: 'chatgpt-plus', seats: 1, monthlySpend: 20 },
                { toolId: 'cursor', planId: 'cursor-pro', seats: 1, monthlySpend: 20 },
            ],
            primaryUseCase: 'coding',
            teamSize: 1,
        });

        const result = runAudit(input);
        const chatgptResult = result.perTool.find((t) => t.toolId === 'chatgpt');

        expect(chatgptResult).toBeDefined();
        expect(chatgptResult!.estimatedMonthlySavings).toBeGreaterThan(0);
        expect(chatgptResult!.recommendedTool).toBe('Cursor');
    });

    // ── Test 4: Total savings = sum of perTool savings ──
    it('correctly sums total monthly savings from all per-tool savings', () => {
        const input = makeInput({
            tools: [
                { toolId: 'claude', planId: 'claude-team', seats: 1, monthlySpend: 30 },
                { toolId: 'chatgpt', planId: 'chatgpt-plus', seats: 1, monthlySpend: 20 },
                { toolId: 'cursor', planId: 'cursor-pro', seats: 1, monthlySpend: 20 },
            ],
            primaryUseCase: 'coding',
            teamSize: 1,
        });

        const result = runAudit(input);
        const expectedSum = result.perTool.reduce((sum, t) => sum + t.estimatedMonthlySavings, 0);

        // Both values should be rounded to 2 decimals
        expect(result.totalMonthlySavings).toBe(Math.round(expectedSum * 100) / 100);
        expect(result.totalAnnualSavings).toBe(Math.round(expectedSum * 12 * 100) / 100);
    });

    // ── Test 5: savingsLevel thresholds ──
    describe('savings level thresholds', () => {
        function getLevel(monthlySavings: number): AuditResult['savingsLevel'] {
            // Build an input that produces the target savings
            // We'll use Cursor business with 1 seat and varying monthlySpend to trigger overpayment
            const input = makeInput({
                tools: [
                    {
                        toolId: 'cursor',
                        planId: 'cursor-business',
                        seats: 1,
                        monthlySpend: 40 + monthlySavings * 1.2, // Ensure overpayment triggers
                    },
                ],
                teamSize: 1,
            });
            const result = runAudit(input);
            return result.savingsLevel;
        }

        it('returns "none" for $0 savings', () => {
            // Use Copilot Individual ($10/user) — cheapest paid IDE, no savings
            const input = makeInput({
                tools: [
                    { toolId: 'github-copilot', planId: 'copilot-individual', seats: 5, monthlySpend: 50 },
                ],
                teamSize: 5,
            });
            const result = runAudit(input);
            expect(result.savingsLevel).toBe('none');
        });

        it('returns "low" for < $100/mo savings', () => {
            // 1 seat on team plan, spend matches → team downgrade savings ~$10
            const input = makeInput({
                tools: [
                    { toolId: 'claude', planId: 'claude-team', seats: 1, monthlySpend: 30 },
                ],
                teamSize: 1,
            });
            const result = runAudit(input);
            expect(result.totalMonthlySavings).toBeGreaterThan(0);
            expect(result.totalMonthlySavings).toBeLessThan(100);
            expect(result.savingsLevel).toBe('low');
        });

        it('returns "medium" for $100-$500/mo savings', () => {
            // Multiple overpaying tools to hit medium range
            const input = makeInput({
                tools: [
                    { toolId: 'chatgpt', planId: 'chatgpt-enterprise', seats: 1, monthlySpend: 200 },
                    { toolId: 'cursor', planId: 'cursor-pro', seats: 1, monthlySpend: 20 },
                ],
                primaryUseCase: 'coding',
                teamSize: 1,
            });
            const result = runAudit(input);
            expect(result.totalMonthlySavings).toBeGreaterThanOrEqual(100);
            expect(result.totalMonthlySavings).toBeLessThanOrEqual(500);
            expect(result.savingsLevel).toBe('medium');
        });

        it('returns "high" for > $500/mo savings', () => {
            // Heavy overspend on multiple tools
            const input = makeInput({
                tools: [
                    { toolId: 'chatgpt', planId: 'chatgpt-enterprise', seats: 10, monthlySpend: 1200 },
                    { toolId: 'claude', planId: 'claude-enterprise', seats: 10, monthlySpend: 1200 },
                ],
                teamSize: 10,
            });
            const result = runAudit(input);
            expect(result.totalMonthlySavings).toBeGreaterThan(500);
            expect(result.savingsLevel).toBe('high');
        });
    });

    // ── Test 6: Honeypot detection ──
    describe('honeypot detection', () => {
        it('detects filled honeypot field as bot', () => {
            expect(isHoneypotFilled('https://spam.com')).toBe(true);
            expect(isHoneypotFilled('anything')).toBe(true);
        });

        it('passes empty or undefined honeypot as human', () => {
            expect(isHoneypotFilled('')).toBe(false);
            expect(isHoneypotFilled(undefined)).toBe(false);
            expect(isHoneypotFilled('   ')).toBe(false);
        });
    });

    // ── Test 7: Fallback summary when AI call throws ──
    it('returns fallback summary when Anthropic API fails', async () => {
        // Mock the Anthropic SDK to throw
        vi.mock('@anthropic-ai/sdk', () => {
            return {
                default: class MockAnthropic {
                    messages = {
                        create: () => { throw new Error('API key invalid'); },
                    };
                },
            };
        });

        // Need to re-import after mock
        const { generateAuditSummary } = await import('@/lib/ai-summary');

        const mockAuditResult: AuditResult = {
            id: '00000000-0000-0000-0000-000000000001',
            perTool: [
                {
                    toolId: 'cursor',
                    toolName: 'Cursor',
                    currentPlan: 'Pro',
                    currentMonthlySpend: 20,
                    recommendation: 'Your spend looks optimized.',
                    estimatedMonthlySavings: 0,
                    reasoning: 'Current plan is well matched.',
                },
            ],
            totalMonthlySavings: 0,
            totalAnnualSavings: 0,
            savingsLevel: 'none',
            createdAt: new Date().toISOString(),
        };

        const result = await generateAuditSummary(mockAuditResult);

        expect(result.isAI).toBe(false);
        expect(result.summary).toBeTruthy();
        expect(typeof result.summary).toBe('string');
        expect(result.summary.length).toBeGreaterThan(20);
    });
});

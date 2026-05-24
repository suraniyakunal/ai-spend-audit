import { v4 as uuidv4 } from 'uuid';
import {
    AuditInput,
    AuditResult,
    ToolAuditResult,
    SavingsLevel,
} from './types';
import { PRICING_DATA, getToolById, getPlanById } from './pricing-data';

/**
 * Core audit engine — runs hardcoded savings rules against the user's tool stack.
 * No AI involved; pure deterministic logic.
 */
export function runAudit(input: AuditInput): AuditResult {
    const perTool: ToolAuditResult[] = [];

    for (const entry of input.tools) {
        const result = auditSingleTool(entry, input);
        if (result) {
            perTool.push(result);
        }
    }

    const totalMonthlySavings = perTool.reduce(
        (sum, t) => sum + t.estimatedMonthlySavings,
        0
    );
    const totalAnnualSavings = totalMonthlySavings * 12;

    return {
        id: uuidv4(),
        perTool,
        totalMonthlySavings: round2(totalMonthlySavings),
        totalAnnualSavings: round2(totalAnnualSavings),
        savingsLevel: classifySavings(totalMonthlySavings),
        createdAt: new Date().toISOString(),
    };
}

// ─── Internal helpers ───

function auditSingleTool(
    entry: { toolId: string; planId: string; seats: number; monthlySpend: number },
    input: AuditInput
): ToolAuditResult | null {
    const lookup = getPlanById(entry.toolId, entry.planId);
    if (!lookup) {
        return {
            toolId: entry.toolId,
            toolName: entry.toolId,
            currentPlan: entry.planId,
            currentMonthlySpend: entry.monthlySpend,
            recommendation: 'Tool or plan not recognized in our database.',
            estimatedMonthlySavings: 0,
            reasoning: 'Could not find pricing data for this tool/plan combination.',
        };
    }

    const { tool, plan } = lookup;
    const recommendations: string[] = [];
    let totalSavings = 0;
    let recommendedPlan: string | undefined;
    let recommendedTool: string | undefined;

    // ── Rule 0: Data inconsistency — $0 spend on a paid plan ──
    if (entry.monthlySpend === 0 && plan.pricePerUserPerMonth > 0) {
        return {
            toolId: tool.id,
            toolName: tool.name,
            currentPlan: plan.name,
            currentMonthlySpend: 0,
            recommendation: 'Data inconsistency: you reported $0 spend on a paid plan. Please re-check.',
            estimatedMonthlySavings: 0,
            reasoning:
                'Monthly spend is $0 but the selected plan has a non-zero price. Skipping analysis — please verify your spend data.',
        };
    }

    // ── Rule 1: Team plan with < 3 seats → recommend downgrade ──
    const isTeamPlan =
        plan.name.toLowerCase().includes('team') ||
        plan.name.toLowerCase().includes('business') ||
        plan.name.toLowerCase().includes('enterprise');

    if (isTeamPlan && entry.seats < 3) {
        const individualPlan = findCheaperIndividualPlan(tool, plan);
        if (individualPlan) {
            const newCost = individualPlan.pricePerUserPerMonth * entry.seats;
            const savings = entry.monthlySpend - newCost;
            if (savings > 0) {
                totalSavings += savings;
                recommendedPlan = individualPlan.name;
                recommendations.push(
                    `With only ${entry.seats} seat(s), the ${individualPlan.name} plan ($${individualPlan.pricePerUserPerMonth}/user/mo) saves you $${round2(savings)}/mo vs your Team/Business plan.`
                );
            }
        }
    }

    // ── Rule 2: Overpayment detection ──
    const expectedCost = plan.pricePerUserPerMonth * entry.seats;
    if (expectedCost > 0 && entry.monthlySpend > expectedCost * 1.1) {
        const overpayment = entry.monthlySpend - expectedCost;
        // Only add if we haven't already recommended a downgrade that saves more
        if (overpayment > totalSavings) {
            totalSavings = overpayment;
        }
        recommendations.push(
            `You're paying $${round2(entry.monthlySpend)}/mo but ${entry.seats} seats on ${plan.name} should cost $${round2(expectedCost)}/mo. You may have unused seats or a billing discrepancy — potential savings: $${round2(overpayment)}/mo.`
        );
    }

    // ── Rule 3: ChatGPT + Cursor coding redundancy ──
    if (
        input.primaryUseCase === 'coding' &&
        entry.toolId === 'chatgpt' &&
        input.tools.some((t) => t.toolId === 'cursor')
    ) {
        const chatgptSavings = entry.monthlySpend;
        if (chatgptSavings > totalSavings) {
            totalSavings = chatgptSavings;
        }
        recommendedTool = 'Cursor';
        recommendations.push(
            `For coding, Cursor handles both AI code generation and chat. Dropping ChatGPT saves $${round2(chatgptSavings)}/mo.`
        );
    }

    // ── Rule 4: Anthropic API + Claude Pro redundancy ──
    if (
        entry.toolId === 'claude' &&
        plan.id === 'claude-pro' &&
        input.tools.some((t) => t.toolId === 'anthropic-api')
    ) {
        const claudeProSavings = entry.monthlySpend;
        if (claudeProSavings > totalSavings) {
            totalSavings = claudeProSavings;
        }
        recommendedTool = 'Anthropic API (direct)';
        recommendations.push(
            `You're paying for both Claude Pro and Anthropic API access. If your team is technical, API-only access is more cost-effective. Drop Claude Pro to save $${round2(claudeProSavings)}/mo.`
        );
    }

    // ── Rule 5: Gemini Pro with ≤ 2 team members → check free tier ──
    if (
        entry.toolId === 'gemini' &&
        (plan.id === 'gemini-pro') &&
        input.teamSize <= 2
    ) {
        const geminiSavings = entry.monthlySpend;
        if (geminiSavings > totalSavings) {
            totalSavings = geminiSavings;
        }
        recommendedPlan = 'Free';
        recommendations.push(
            `With a team of ${input.teamSize}, Gemini's free tier likely covers your needs. Dropping Pro saves $${round2(geminiSavings)}/mo.`
        );
    }

    // ── Rule 6: Cross-tool 20% cheaper alternative ──
    const cheaperAlt = findCheaperAlternative(tool, plan, entry.seats, entry.monthlySpend);
    if (cheaperAlt && cheaperAlt.savings > totalSavings) {
        totalSavings = cheaperAlt.savings;
        recommendedTool = cheaperAlt.toolName;
        recommendedPlan = cheaperAlt.planName;
        recommendations.push(
            `${cheaperAlt.toolName} (${cheaperAlt.planName}) does a similar job for $${round2(cheaperAlt.cost)}/mo — that's ${round2((cheaperAlt.savings / entry.monthlySpend) * 100)}% less.`
        );
    }

    // ── Build final result ──
    if (recommendations.length === 0) {
        return {
            toolId: tool.id,
            toolName: tool.name,
            currentPlan: plan.name,
            currentMonthlySpend: entry.monthlySpend,
            recommendation: 'Your spend looks optimized — no changes recommended.',
            estimatedMonthlySavings: 0,
            reasoning: 'Current plan and spend are well-matched for your usage.',
        };
    }

    return {
        toolId: tool.id,
        toolName: tool.name,
        currentPlan: plan.name,
        currentMonthlySpend: entry.monthlySpend,
        recommendation: recommendations[0],
        recommendedPlan,
        recommendedTool,
        estimatedMonthlySavings: round2(totalSavings),
        reasoning: recommendations.join(' '),
    };
}

/**
 * Find a cheaper individual/solo plan for a tool (used by Rule 1).
 */
function findCheaperIndividualPlan(
    tool: { plans: { id: string; name: string; pricePerUserPerMonth: number }[] },
    currentPlan: { pricePerUserPerMonth: number }
) {
    const candidates = tool.plans.filter(
        (p) =>
            p.pricePerUserPerMonth < currentPlan.pricePerUserPerMonth &&
            !p.name.toLowerCase().includes('team') &&
            !p.name.toLowerCase().includes('business') &&
            !p.name.toLowerCase().includes('enterprise') &&
            p.pricePerUserPerMonth > 0
    );
    // Return the most expensive non-team plan (best feature match)
    candidates.sort((a, b) => b.pricePerUserPerMonth - a.pricePerUserPerMonth);
    return candidates[0] || null;
}

/**
 * Find a cross-category alternative that is ≥ 20% cheaper (Rule 6).
 * Only compares tools in the same category.
 */
function findCheaperAlternative(
    currentTool: { id: string; category: string },
    currentPlan: { pricePerUserPerMonth: number },
    seats: number,
    currentSpend: number
): { toolName: string; planName: string; cost: number; savings: number } | null {
    if (currentSpend <= 0) return null;

    const threshold = currentSpend * 0.8; // must be at least 20% cheaper
    let bestAlt: { toolName: string; planName: string; cost: number; savings: number } | null = null;

    for (const altTool of PRICING_DATA) {
        if (altTool.id === currentTool.id) continue;
        if (altTool.category !== currentTool.category) continue;

        for (const altPlan of altTool.plans) {
            if (altPlan.pricePerUserPerMonth === 0) continue; // skip free plans as alternatives

            const altCost = altPlan.pricePerUserPerMonth * seats;
            if (altCost < threshold) {
                const savings = currentSpend - altCost;
                if (!bestAlt || savings > bestAlt.savings) {
                    bestAlt = {
                        toolName: altTool.name,
                        planName: altPlan.name,
                        cost: altCost,
                        savings,
                    };
                }
            }
        }
    }

    return bestAlt;
}

function classifySavings(monthlySavings: number): SavingsLevel {
    if (monthlySavings <= 0) return 'none';
    if (monthlySavings < 100) return 'low';
    if (monthlySavings <= 500) return 'medium';
    return 'high';
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

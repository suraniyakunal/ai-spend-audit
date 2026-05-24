import Anthropic from '@anthropic-ai/sdk';
import { AuditResult, SummaryResult } from './types';

/**
 * Generate a CFO-ready AI summary of audit results using Claude.
 * Falls back to a templated summary if the Anthropic API fails for any reason.
 */
export async function generateAuditSummary(
    auditResult: AuditResult
): Promise<SummaryResult> {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is not set');
        }

        const client = new Anthropic({ apiKey });

        const toolSummaries = auditResult.perTool
            .map(
                (t) =>
                    `- ${t.toolName} (${t.currentPlan}): spending $${t.currentMonthlySpend}/mo. ${t.recommendation} Potential savings: $${t.estimatedMonthlySavings}/mo.`
            )
            .join('\n');

        const prompt = `You are a finops analyst writing a summary for a startup CFO.

Here are the AI tool audit results:

Total Monthly Savings: $${auditResult.totalMonthlySavings}/mo
Total Annual Savings: $${auditResult.totalAnnualSavings}/yr
Savings Level: ${auditResult.savingsLevel}

Tool-by-tool breakdown:
${toolSummaries}

Write a concise 3-5 paragraph executive summary that:
1. Opens with the total savings opportunity
2. Highlights the top 2-3 actionable recommendations
3. Explains the reasoning in terms a non-technical finance person would understand
4. Closes with a priority-ordered action plan

Keep it under 300 words. Use plain language, no jargon. Format with markdown headers and bullet points.`;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });

        const textBlock = message.content.find((block) => block.type === 'text');
        const summary = textBlock?.text || '';

        if (!summary) {
            throw new Error('Empty response from Anthropic API');
        }

        return { summary, isAI: true };
    } catch {
        return { summary: buildFallbackSummary(auditResult), isAI: false };
    }
}

/**
 * Build a deterministic fallback summary from audit results.
 * Used when the Anthropic API is unavailable or returns an error.
 */
function buildFallbackSummary(auditResult: AuditResult): string {
    const monthly = auditResult.totalMonthlySavings.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    const annual = auditResult.totalAnnualSavings.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    // Pick the top 2 recommendations by savings
    const topRecs = [...auditResult.perTool]
        .filter((t) => t.estimatedMonthlySavings > 0)
        .sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings)
        .slice(0, 2);

    const recList =
        topRecs.length > 0
            ? topRecs.map((t) => t.recommendation).join(' ')
            : 'Review your current plans for potential consolidation opportunities.';

    return `Based on your current AI tool stack, you could save $${monthly}/month ($${annual}/year) by making a few targeted changes. ${recList} These optimizations maintain your team's capabilities while reducing unnecessary spend.`;
}

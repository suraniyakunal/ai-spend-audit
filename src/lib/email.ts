import { Resend } from 'resend';

/**
 * Send the audit results email via Resend.
 */
export async function sendAuditEmail(
    to: string,
    totalMonthlySavings: number,
    totalAnnualSavings: number,
    auditId: string
) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || 'audit@credex.app';

    if (!apiKey) {
        console.warn('RESEND_API_KEY not set — skipping email send');
        return { success: false, error: 'Missing API key' };
    }

    const resend = new Resend(apiKey);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const savingsText =
        totalMonthlySavings > 0
            ? `Your estimated savings: $${totalMonthlySavings.toFixed(0)}/month ($${totalAnnualSavings.toFixed(0)}/year)`
            : 'Your AI spend looks well-optimized — no significant savings found.';

    const highSavingsNote =
        totalMonthlySavings >= 500
            ? '\n\nYou qualify for high-savings optimization. A Credex advisor will reach out to help you implement these changes.'
            : '';

    try {
        await resend.emails.send({
            from,
            to,
            subject: 'Your AI Spend Audit is ready',
            text: `Hi there,

Your AI Spend Audit is complete!

${savingsText}${highSavingsNote}

View your full results: ${appUrl}/results/${auditId}

— The Credex Team

This is an automated email from your AI Spend Audit. If you didn't request this, you can safely ignore it.`,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: 'Email send failed' };
    }
}

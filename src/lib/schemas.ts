import { z } from 'zod';
import { PRICING_DATA } from './pricing-data';

// ─── Derived enum values from pricing data ───
const validToolIds = PRICING_DATA.map((t) => t.id);
const validPlanIds = PRICING_DATA.flatMap((t) => t.plans.map((p) => p.id));

const VALID_USE_CASES = ['coding', 'writing', 'data', 'research', 'mixed'] as const;

// ─── Tool entry schema ───
const toolEntrySchema = z.object({
    toolId: z
        .string()
        .min(1, 'toolId is required')
        .refine((id) => validToolIds.includes(id), {
            message: 'Unknown toolId',
        }),
    planId: z
        .string()
        .min(1, 'planId is required')
        .refine((id) => validPlanIds.includes(id), {
            message: 'Unknown planId',
        }),
    seats: z.number().int().min(1).max(10000, 'seats must be between 1 and 10,000'),
    monthlySpend: z.number().min(0, 'monthlySpend must be non-negative'),
});

// ─── Audit input schema ───
export const auditInputSchema = z.object({
    tools: z
        .array(toolEntrySchema)
        .min(1, 'At least one tool is required')
        .max(8, 'Maximum 8 tools allowed'),
    teamSize: z.number().int().min(1).max(1000, 'teamSize must be between 1 and 1,000'),
    primaryUseCase: z.enum(VALID_USE_CASES, {
        error: `primaryUseCase must be one of: ${VALID_USE_CASES.join(', ')}`,
    }),
});

// ─── Lead input schema ───
export const leadInputSchema = z.object({
    auditId: z
        .string()
        .uuid('Invalid auditId format'),
    email: z
        .string()
        .email('Invalid email format'),
    companyName: z.string().trim().optional(),
    role: z.string().trim().optional(),
    teamSize: z.number().int().positive().optional(),
    website: z.string().optional(), // Honeypot field
});

// ─── Summary input schema ───
export const summaryInputSchema = z.object({
    auditId: z.string().uuid('Invalid auditId format'),
});

// ─── Honeypot detection helper ───
/**
 * Returns true if the honeypot field is filled (indicates a bot).
 */
export function isHoneypotFilled(website: string | undefined): boolean {
    return typeof website === 'string' && website.trim().length > 0;
}

// ─── Type exports ───
export type AuditInputPayload = z.infer<typeof auditInputSchema>;
export type LeadInputPayload = z.infer<typeof leadInputSchema>;
export type SummaryInputPayload = z.infer<typeof summaryInputSchema>;

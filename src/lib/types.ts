// ─── Pricing Types ───

export type PricingPlan = {
    id: string;
    name: string;
    pricePerUserPerMonth: number;
    annualDiscount?: number; // percentage, e.g. 0.20 = 20%
    notes?: string;
};

export type PricingCategory = 'ide' | 'assistant' | 'api' | 'platform';

export type PricingTool = {
    id: string;
    name: string;
    plans: PricingPlan[];
    category: PricingCategory;
};

// ─── Audit Input Types ───

export type ToolEntry = {
    toolId: string;
    planId: string;
    seats: number;
    monthlySpend: number;
};

export type PrimaryUseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';

export type AuditInput = {
    tools: ToolEntry[];
    teamSize: number;
    primaryUseCase: PrimaryUseCase;
};

// ─── Audit Result Types ───

export type ToolAuditResult = {
    toolId: string;
    toolName: string;
    currentPlan: string;
    currentMonthlySpend: number;
    recommendation: string;
    recommendedPlan?: string;
    recommendedTool?: string;
    estimatedMonthlySavings: number;
    reasoning: string;
};

export type SavingsLevel = 'none' | 'low' | 'medium' | 'high';

export type AuditResult = {
    id: string;
    perTool: ToolAuditResult[];
    totalMonthlySavings: number;
    totalAnnualSavings: number;
    savingsLevel: SavingsLevel;
    createdAt: string;
};

// ─── Lead Types ───

export type LeadInput = {
    auditId: string;
    email: string;
    companyName?: string;
    role?: string;
    teamSize?: number;
};

// ─── Summary Types ───

export type SummaryResult = {
    summary: string;
    isAI: boolean;
};

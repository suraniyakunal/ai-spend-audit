import { PricingTool } from './types';

/**
 * Accurate AI tool pricing as of May 2025.
 * Each tool has plans with per-user-per-month pricing.
 */
export const PRICING_DATA: PricingTool[] = [
    // ─── Cursor ───
    {
        id: 'cursor',
        name: 'Cursor',
        category: 'ide',
        plans: [
            {
                id: 'cursor-hobby',
                name: 'Hobby',
                pricePerUserPerMonth: 0,
                notes: 'Limited completions, 50 slow premium requests',
            },
            {
                id: 'cursor-pro',
                name: 'Pro',
                pricePerUserPerMonth: 20,
                annualDiscount: 0.17,
                notes: '500 fast premium requests, unlimited slow, unlimited completions',
            },
            {
                id: 'cursor-business',
                name: 'Business',
                pricePerUserPerMonth: 40,
                annualDiscount: 0.17,
                notes: 'Everything in Pro + admin dashboard, SAML SSO, enforced privacy mode',
            },
        ],
    },

    // ─── GitHub Copilot ───
    {
        id: 'github-copilot',
        name: 'GitHub Copilot',
        category: 'ide',
        plans: [
            {
                id: 'copilot-individual',
                name: 'Individual',
                pricePerUserPerMonth: 10,
                annualDiscount: 0.17,
                notes: 'Code completions, chat, CLI, multi-model support',
            },
            {
                id: 'copilot-business',
                name: 'Business',
                pricePerUserPerMonth: 19,
                notes: 'Everything in Individual + org management, IP indemnity, policy controls',
            },
            {
                id: 'copilot-enterprise',
                name: 'Enterprise',
                pricePerUserPerMonth: 39,
                notes: 'Everything in Business + knowledge bases, fine-tuned models',
            },
        ],
    },

    // ─── Claude (Anthropic) ───
    {
        id: 'claude',
        name: 'Claude (Anthropic)',
        category: 'assistant',
        plans: [
            {
                id: 'claude-free',
                name: 'Free',
                pricePerUserPerMonth: 0,
                notes: 'Limited daily usage of Claude Sonnet',
            },
            {
                id: 'claude-pro',
                name: 'Pro',
                pricePerUserPerMonth: 20,
                notes: '5x more usage, priority access, Claude Opus + Sonnet',
            },
            {
                id: 'claude-max',
                name: 'Max',
                pricePerUserPerMonth: 100,
                notes: '20x more usage, all features, extended thinking',
            },
            {
                id: 'claude-team',
                name: 'Team',
                pricePerUserPerMonth: 30,
                notes: 'Higher limits, team collaboration, admin controls',
            },
            {
                id: 'claude-enterprise',
                name: 'Enterprise',
                pricePerUserPerMonth: 60,
                notes: 'Custom pricing (est. ~$60), SSO, SCIM, expanded context, audit logs',
            },
        ],
    },

    // ─── ChatGPT (OpenAI) ───
    {
        id: 'chatgpt',
        name: 'ChatGPT (OpenAI)',
        category: 'assistant',
        plans: [
            {
                id: 'chatgpt-plus',
                name: 'Plus',
                pricePerUserPerMonth: 20,
                notes: 'GPT-4o, GPT-4, DALL·E, Code Interpreter, Advanced Data Analysis',
            },
            {
                id: 'chatgpt-team',
                name: 'Team',
                pricePerUserPerMonth: 30,
                annualDiscount: 0.17,
                notes: 'Everything in Plus + higher caps, workspace, admin console',
            },
            {
                id: 'chatgpt-enterprise',
                name: 'Enterprise',
                pricePerUserPerMonth: 60,
                notes: 'Custom pricing (est. ~$60), unlimited GPT-4, SSO, analytics, dedicated support',
            },
        ],
    },

    // ─── Anthropic API ───
    {
        id: 'anthropic-api',
        name: 'Anthropic API',
        category: 'api',
        plans: [
            {
                id: 'anthropic-api-light',
                name: 'Light Usage',
                pricePerUserPerMonth: 30,
                notes: 'Estimated for light usage (~1M tokens/mo)',
            },
            {
                id: 'anthropic-api-medium',
                name: 'Medium Usage',
                pricePerUserPerMonth: 100,
                notes: 'Estimated for medium usage (~5M tokens/mo)',
            },
            {
                id: 'anthropic-api-heavy',
                name: 'Heavy Usage',
                pricePerUserPerMonth: 300,
                notes: 'Estimated for heavy usage (~15M+ tokens/mo)',
            },
        ],
    },

    // ─── OpenAI API ───
    {
        id: 'openai-api',
        name: 'OpenAI API',
        category: 'api',
        plans: [
            {
                id: 'openai-api-light',
                name: 'Light Usage',
                pricePerUserPerMonth: 30,
                notes: 'Estimated for light usage (~1M tokens/mo)',
            },
            {
                id: 'openai-api-medium',
                name: 'Medium Usage',
                pricePerUserPerMonth: 100,
                notes: 'Estimated for medium usage (~5M tokens/mo)',
            },
            {
                id: 'openai-api-heavy',
                name: 'Heavy Usage',
                pricePerUserPerMonth: 300,
                notes: 'Estimated for heavy usage (~15M+ tokens/mo)',
            },
        ],
    },

    // ─── Gemini ───
    {
        id: 'gemini',
        name: 'Gemini',
        category: 'platform',
        plans: [
            {
                id: 'gemini-free',
                name: 'Free',
                pricePerUserPerMonth: 0,
                notes: 'Limited Gemini access',
            },
            {
                id: 'gemini-pro',
                name: 'Pro (Advanced)',
                pricePerUserPerMonth: 20,
                notes: 'Gemini Ultra model, 2TB storage, Google One AI Premium',
            },
            {
                id: 'gemini-ultra',
                name: 'Ultra',
                pricePerUserPerMonth: 30,
                notes: 'Highest tier, all models, priority access',
            },
            {
                id: 'gemini-api-light',
                name: 'API Light',
                pricePerUserPerMonth: 30,
                notes: 'Usage-based API access, light usage estimate',
            },
            {
                id: 'gemini-api-medium',
                name: 'API Medium',
                pricePerUserPerMonth: 100,
                notes: 'Usage-based API access, medium usage estimate',
            },
        ],
    },

    // ─── Windsurf ───
    {
        id: 'windsurf',
        name: 'Windsurf',
        category: 'ide',
        plans: [
            {
                id: 'windsurf-free',
                name: 'Free',
                pricePerUserPerMonth: 0,
                notes: 'Basic AI features, limited credits',
            },
            {
                id: 'windsurf-pro',
                name: 'Pro',
                pricePerUserPerMonth: 15,
                notes: 'Unlimited completions, premium model access, Cascade flows',
            },
            {
                id: 'windsurf-teams',
                name: 'Teams',
                pricePerUserPerMonth: 35,
                notes: 'Everything in Pro + team management, usage analytics',
            },
        ],
    },
];

/**
 * Helper: Look up a tool by its ID
 */
export function getToolById(toolId: string): PricingTool | undefined {
    return PRICING_DATA.find((t) => t.id === toolId);
}

/**
 * Helper: Look up a plan by tool ID + plan ID
 */
export function getPlanById(
    toolId: string,
    planId: string
): { tool: PricingTool; plan: import('./types').PricingPlan } | undefined {
    const tool = getToolById(toolId);
    if (!tool) return undefined;
    const plan = tool.plans.find((p) => p.id === planId);
    if (!plan) return undefined;
    return { tool, plan };
}

/**
 * Helper: Get all tools in a category
 */
export function getToolsByCategory(
    category: import('./types').PricingCategory
): PricingTool[] {
    return PRICING_DATA.filter((t) => t.category === category);
}
